"""
Price comparison logic in pure Python - no Claude API needed.
Fetches prices from Zepto/Instamart (or mocks) and computes optimal cart.
"""
import os
from dotenv import load_dotenv
from mock_providers import mock_search_zepto, mock_search_instamart, mock_place_order

load_dotenv()

ZEPTO_DELIVERY_FEE = int(os.getenv("ZEPTO_DELIVERY_FEE", "25"))
INSTAMART_DELIVERY_FEE = int(os.getenv("INSTAMART_DELIVERY_FEE", "30"))


class GroceryAgent:
    async def compare_prices(self, items: list[dict]) -> dict:
        result_items = []
        zepto_subtotal = 0
        instamart_subtotal = 0

        zepto_cart = []
        instamart_cart = []

        for item in items:
            name = item["name"]
            qty = item.get("quantity", 1)

            z = mock_search_zepto(name)
            im = mock_search_instamart(name)

            z_price = z.get("price") if z.get("found") else None
            im_price = im.get("price") if im.get("found") else None

            if z_price and im_price:
                better = "zepto" if z_price <= im_price else "instamart"
                savings = abs(z_price - im_price)
            elif z_price:
                better = "only_zepto"
                savings = 0
            elif im_price:
                better = "only_instamart"
                savings = 0
            else:
                better = "same"
                savings = 0

            zepto_subtotal += (z_price or 0) * qty
            instamart_subtotal += (im_price or 0) * qty

            result_items.append({
                "query": name,
                "quantity": qty,
                "zepto": {
                    "found": z.get("found", False),
                    "product_name": z.get("name", name),
                    "price": z_price,
                    "mrp": z.get("mrp"),
                    "unit": z.get("unit"),
                    "in_stock": z.get("in_stock", False),
                    "product_id": z.get("id"),
                } if z.get("found") else {"found": False},
                "instamart": {
                    "found": im.get("found", False),
                    "product_name": im.get("name", name),
                    "price": im_price,
                    "mrp": im.get("mrp"),
                    "unit": im.get("unit"),
                    "in_stock": im.get("in_stock", False),
                    "product_id": im.get("id"),
                } if im.get("found") else {"found": False},
                "better_platform": better,
                "savings_per_unit": savings,
            })

            # Build optimal cart entries
            if better in ("zepto", "only_zepto"):
                zepto_cart.append({
                    "product_id": z.get("id"), "product_name": z.get("name"),
                    "price": z_price, "quantity": qty, "unit": z.get("unit"),
                })
            elif better in ("instamart", "only_instamart"):
                instamart_cart.append({
                    "product_id": im.get("id"), "product_name": im.get("name"),
                    "price": im_price, "quantity": qty, "unit": im.get("unit"),
                })
            else:
                # same price or neither found — prefer zepto
                if z.get("found"):
                    zepto_cart.append({
                        "product_id": z.get("id"), "product_name": z.get("name"),
                        "price": z_price, "quantity": qty, "unit": z.get("unit"),
                    })

        zepto_total = zepto_subtotal + ZEPTO_DELIVERY_FEE
        instamart_total = instamart_subtotal + INSTAMART_DELIVERY_FEE

        # Optimal split cart totals
        split_zepto_cost = sum(i["price"] * i["quantity"] for i in zepto_cart)
        split_instamart_cost = sum(i["price"] * i["quantity"] for i in instamart_cart)
        split_delivery = (ZEPTO_DELIVERY_FEE if zepto_cart else 0) + \
                         (INSTAMART_DELIVERY_FEE if instamart_cart else 0)
        split_total = split_zepto_cost + split_instamart_cost + split_delivery

        costs = {"zepto": zepto_total, "instamart": instamart_total, "split": split_total}
        optimal_strategy = min(costs, key=costs.get)
        optimal_total = costs[optimal_strategy]
        max_cost = max(zepto_total, instamart_total)

        reasons = {
            "zepto": f"Zepto is cheaper overall at ₹{zepto_total} vs Instamart's ₹{instamart_total}.",
            "instamart": f"Instamart is cheaper overall at ₹{instamart_total} vs Zepto's ₹{zepto_total}.",
            "split": f"Splitting saves ₹{max_cost - split_total:.0f} vs ordering from one platform.",
        }

        # For single-platform strategies, put everything in that platform's cart
        if optimal_strategy == "zepto":
            final_zepto = [{"product_id": i["zepto"]["product_id"], "product_name": i["zepto"]["product_name"],
                            "price": i["zepto"]["price"], "quantity": i["quantity"], "unit": i["zepto"]["unit"]}
                           for i in result_items if i["zepto"].get("found")]
            final_instamart = []
        elif optimal_strategy == "instamart":
            final_zepto = []
            final_instamart = [{"product_id": i["instamart"]["product_id"], "product_name": i["instamart"]["product_name"],
                                "price": i["instamart"]["price"], "quantity": i["quantity"], "unit": i["instamart"]["unit"]}
                               for i in result_items if i["instamart"].get("found")]
        else:
            final_zepto = zepto_cart
            final_instamart = instamart_cart

        return {
            "items": result_items,
            "summary": {
                "zepto_subtotal": zepto_subtotal,
                "instamart_subtotal": instamart_subtotal,
                "zepto_total_with_delivery": zepto_total,
                "instamart_total_with_delivery": instamart_total,
                "optimal_strategy": optimal_strategy,
                "optimal_total": optimal_total,
                "total_savings_vs_expensive": max_cost - optimal_total,
                "recommendation_reason": reasons[optimal_strategy],
            },
            "optimal_cart": {
                "zepto": final_zepto,
                "instamart": final_instamart,
            },
        }

    async def place_order(self, platform: str, cart_items: list[dict]) -> dict:
        return mock_place_order(platform, cart_items)
