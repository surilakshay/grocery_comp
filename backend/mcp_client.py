"""
Thin async client for talking to an MCP server over HTTP (JSON-RPC 2.0).
Handles initialize handshake, tool discovery, and tool invocation.
"""
import httpx
from typing import Any


class MCPClient:
    def __init__(self, url: str, token: str | None = None, name: str = "mcp"):
        self.url = url.rstrip("/")
        self.name = name
        self._headers = {"Content-Type": "application/json"}
        if token:
            self._headers["Authorization"] = f"Bearer {token}"
        self._initialized = False
        self._tools: list[dict] = []

    async def _rpc(self, method: str, params: dict | None = None, id: int = 1) -> Any:
        payload = {"jsonrpc": "2.0", "id": id, "method": method, "params": params or {}}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(self.url, json=payload, headers=self._headers)
            r.raise_for_status()
            data = r.json()
        if "error" in data:
            raise RuntimeError(f"MCP error from {self.name}: {data['error']}")
        return data.get("result")

    async def initialize(self) -> None:
        if self._initialized:
            return
        await self._rpc("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "grocery-comparator", "version": "1.0"}
        })
        self._initialized = True

    async def list_tools(self) -> list[dict]:
        await self.initialize()
        result = await self._rpc("tools/list")
        self._tools = result.get("tools", [])
        return self._tools

    async def call_tool(self, tool_name: str, arguments: dict) -> Any:
        await self.initialize()
        result = await self._rpc("tools/call", {"name": tool_name, "arguments": arguments})
        # MCP returns content array; extract text
        if isinstance(result, dict) and "content" in result:
            parts = result["content"]
            if parts and isinstance(parts[0], dict):
                return parts[0].get("text") or parts[0]
        return result

    def tools_as_anthropic_format(self) -> list[dict]:
        """Convert MCP tool descriptors to Anthropic tool_choice format."""
        anthropic_tools = []
        for t in self._tools:
            anthropic_tools.append({
                "name": f"{self.name}__{t['name']}",
                "description": t.get("description", ""),
                "input_schema": t.get("inputSchema", {"type": "object", "properties": {}}),
            })
        return anthropic_tools
