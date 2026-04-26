"""
Claude-powered grocery price comparison agent.

Architecture:
- Uses Claude as the reasoning engine
- Calls Zepto / Instamart via MCP tools (or mock providers in dev mode)
- Returns structured comparison + optimal cart recommendation
"""
import os
import json
import asyncio
from typing import Any

import anthropic
from dotenv import load_dotenv

from mcp_client import MCPClient
from mock_providers import mock_search_zepto, mock_search_instamart, mock_place_order

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
USE_MOCK = os.getenv("USE_MOCK_PROVIDERS", "true").lower() == "true"
ZEPTO_DELIVERY_FEE = int(os.getenv("ZEPTO_DELIVERY_FEE", "25"))
INSTAMART_DELIVERY_FEE = int(os.getenv("INSTAMART_DELIVERY_FEE", "30"))

ZEPTO_MCP_URL = os.getenv("ZEPTO_MCP_URL", "")
ZEPTO_MCP_TOKEN = os.getenv("ZEPTO_MCP_TOKEN", "")
INSTAMART_MCP_URL = os.getenv("INSTAMART_MCP_URL", "")
INSTAMART_MCP_TOKEN = os.getenv("INSTAMART_MCP_TOKEN", "")


# ---------------------------------------------------------------------------
# Tool definitions exposed to Claude
# ---------------------------------------------------------------------------

TOOLS: list[dict] = [
    {
        "name": "search_zepto",
        "description": (
            "Search for a grocery product on Zepto and return its price, availability, and product details. "
            "Call this once per item in the grocery list."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "item_name": {
                    "type": "string",
                    "description": "Name of the grocery item to search for (e.g. 'milk', 'basmati rice 1kg')"
                }
            },
            "required": ["item_name"]
        }
    },
    {
        "name": "search_instamart",
        "description": (
            "Search for a grocery product on Instamart (Swiggy) and return its price, availability, and product details. "
            "Call this once per item in the grocery list."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "item_name": {
                    "type": "string",
                    "description": "Name of the grocery item to search for (e.g. 'milk', 'basmati rice 1kg')"
                }
            },
            "required": ["item_name"]
        }
    },
    {
        "name": "place_order",
        "description": "Place a grocery order on the specified platform with the given cart items.",
        "input_schema": {
            "type": "object",
            "properties": {
                "platform": {
                    "type": "string",
                    "enum": ["zepto", "instamart"],
                    "description": "Platform to place the order on"
                },
                "cart_items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "name": {"type": "string"},
                            "price": {"type": "number"},
                            "quantity": {"type": "integer"},
                            "unit": {"type": "string"}
                        },
                        "required": ["id", "name", "price", "quantity"]
                    },
                    "description": "Items to add to cart and order"
                }
            },
            "required": ["platform", "cart_items"]
        }
    }
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------

class ToolExecutor:
    def __init__(self):
        self._zepto_client: MCPClient | None = None
        self._instamart_client: MCPClient | None = None
        if not USE_MOCK:
            if ZEPTO_MCP_URL:
                self._zepto_client = MCPClient(ZEPTO_MCP_URL, ZEPTO_MCP_TOKEN, "zepto")
            if INSTAMART_MCP_URL:
                self._instamart_client = MCPClient(INSTAMART_MCP_URL, INSTAMART_MCP_TOKEN, "instamart")

    async def execute(self, tool_name: str, tool_input: dict) -> Any:
        if tool_name == "search_zepto":
            return await self._search_zepto(tool_input["item_name"])
        elif tool_name == "search_instamart":
            return await self._search_instamart(tool_input["item_name"])
        elif tool_name == "place_order":
            return await self._place_order(tool_input["platform"], tool_input["cart_items"])
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    async def _search_zepto(self, item_name: str) -> dict:
        if self._zepto_client:
            try:
                result = await self._zepto_client.call_tool("search_products", {"query": item_name})
                return result if isinstance(result, dict) else {"raw": result}
            except Exception as e:
                return {"error": str(e), "fallback": mock_search_zepto(item_name)}
        return mock_search_zepto(item_name)

    async def _search_instamart(self, item_name: str) -> dict:
        if self._instamart_client:
            try:
                result = await self._instamart_client.call_tool("search_products", {"query": item_name})
                return result if isinstance(result, dict) else {"raw": result}
            except Exception as e:
                return {"error": str(e), "fallback": mock_search_instamart(item_name)}
        return mock_search_instamart(item_name)

    async def _place_order(self, platform: str, cart_items: list[dict]) -> dict:
        client = self._zepto_client if platform == "zepto" else self._instamart_client
        if client:
            try:
                result = await client.call_tool("place_order", {"items": cart_items})
                return result if isinstance(result, dict) else {"raw": result}
            except Exception as e:
                return {"error": str(e), "fallback": mock_place_order(platform, cart_items)}
        return mock_place_order(platform, cart_items)


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

COMPARISON_SYSTEM_PROMPT = """You are a smart grocery price comparison assistant.
Your job is to help users find the best prices across Zepto and Instamart.

When given a grocery list:
1. Search for EVERY item on BOTH Zepto AND Instamart using the search tools.
2. After collecting all prices, analyze which platform offers a better deal for each item.
3. Compute the optimal cart - decide whether to order everything from one platform
   or split across both (accounting for delivery fees: Zepto=₹{zepto_fee}, Instamart=₹{instamart_fee}).
4. Return your analysis as a single JSON object with this exact structure:

{{
  "items": [
    {{
      "query": "<original item name>",
      "quantity": <requested quantity as integer>,
      "zepto": {{
        "found": true/false,
        "product_name": "...",
        "price": <number>,
        "mrp": <number>,
        "unit": "...",
        "in_stock": true/false,
        "product_id": "..."
      }},
      "instamart": {{
        "found": true/false,
        "product_name": "...",
        "price": <number>,
        "mrp": <number>,
        "unit": "...",
        "in_stock": true/false,
        "product_id": "..."
      }},
      "better_platform": "zepto" | "instamart" | "same" | "only_zepto" | "only_instamart",
      "savings_per_unit": <price difference>
    }}
  ],
  "summary": {{
    "zepto_subtotal": <number>,
    "instamart_subtotal": <number>,
    "zepto_total_with_delivery": <number>,
    "instamart_total_with_delivery": <number>,
    "optimal_strategy": "zepto" | "instamart" | "split",
    "optimal_total": <number>,
    "total_savings_vs_expensive": <number>,
    "recommendation_reason": "<clear explanation>"
  }},
  "optimal_cart": {{
    "zepto": [
      {{"product_id": "...", "product_name": "...", "price": <number>, "quantity": <int>, "unit": "..."}}
    ],
    "instamart": [
      {{"product_id": "...", "product_name": "...", "price": <number>, "quantity": <int>, "unit": "..."}}
    ]
  }}
}}

IMPORTANT: Output ONLY the raw JSON object. No markdown, no explanation text around it."""

ORDER_SYSTEM_PROMPT = """You are a grocery ordering assistant.
When asked to place an order, use the place_order tool with the provided cart items.
After placing the order, return a JSON object:
{{
  "success": true/false,
  "platform": "zepto" | "instamart",
  "order_id": "...",
  "total": <number>,
  "estimated_delivery": "...",
  "message": "..."
}}
Output ONLY the raw JSON object."""


class GroceryAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.executor = ToolExecutor()

    async def compare_prices(self, items: list[dict]) -> dict:
        """Run the price comparison agentic loop."""
        items_text = "\n".join(
            f"- {item['name']}" + (f" x{item.get('quantity', 1)}" if item.get('quantity', 1) > 1 else "")
            + (f" ({item['unit']})" if item.get('unit') else "")
            for item in items
        )
        user_message = f"Please compare prices for these grocery items:\n{items_text}"

        system = COMPARISON_SYSTEM_PROMPT.format(
            zepto_fee=ZEPTO_DELIVERY_FEE,
            instamart_fee=INSTAMART_DELIVERY_FEE,
        )

        messages = [{"role": "user", "content": user_message}]
        result_json = await self._agentic_loop(system, messages, TOOLS[:2])  # only search tools
        return result_json

    async def place_order(self, platform: str, cart_items: list[dict]) -> dict:
        """Place an order on the specified platform."""
        user_message = (
            f"Place an order on {platform} for these items: {json.dumps(cart_items)}"
        )
        messages = [{"role": "user", "content": user_message}]
        result_json = await self._agentic_loop(ORDER_SYSTEM_PROMPT, messages, [TOOLS[2]])
        return result_json

    async def _agentic_loop(self, system: str, messages: list[dict], tools: list[dict]) -> dict:
        """Run tool-use loop until Claude returns a final text response."""
        max_iterations = 20
        for _ in range(max_iterations):
            response = await asyncio.to_thread(
                self.client.messages.create,
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=system,
                messages=messages,
                tools=tools,
            )

            # Collect tool use blocks
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            text_blocks = [b for b in response.content if b.type == "text"]

            if response.stop_reason == "end_turn" or not tool_uses:
                # Final response - parse JSON from text
                raw_text = "".join(b.text for b in text_blocks).strip()
                return self._parse_json(raw_text)

            # Execute all tool calls (in parallel for speed)
            messages.append({"role": "assistant", "content": response.content})

            tool_results = await asyncio.gather(*[
                self._run_tool(tb) for tb in tool_uses
            ])

            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tb.id,
                        "content": json.dumps(result),
                    }
                    for tb, result in zip(tool_uses, tool_results)
                ]
            })

        return {"error": "Agent loop exceeded max iterations"}

    async def _run_tool(self, tool_use_block) -> Any:
        return await self.executor.execute(tool_use_block.name, tool_use_block.input)

    @staticmethod
    def _parse_json(text: str) -> dict:
        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            return {"error": f"Failed to parse agent response: {e}", "raw": text}
