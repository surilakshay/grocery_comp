"""
Mock price data for Zepto and Instamart.
Used when USE_MOCK_PROVIDERS=true or when MCP servers are unavailable.
Realistic Indian grocery prices in INR.
"""
import random
from typing import Any

ZEPTO_CATALOG: dict[str, list[dict]] = {
    "milk": [{"id": "z-milk-1", "name": "Amul Full Cream Milk 1L", "price": 68, "mrp": 72, "unit": "1 L", "in_stock": True}],
    "bread": [{"id": "z-bread-1", "name": "Modern White Bread 400g", "price": 38, "mrp": 40, "unit": "400 g", "in_stock": True}],
    "eggs": [{"id": "z-eggs-1", "name": "Farm Fresh Eggs (6 pcs)", "price": 55, "mrp": 60, "unit": "6 pcs", "in_stock": True}],
    "rice": [{"id": "z-rice-1", "name": "India Gate Basmati Rice 1kg", "price": 130, "mrp": 140, "unit": "1 kg", "in_stock": True}],
    "dal": [{"id": "z-dal-1", "name": "Toor Dal 500g", "price": 72, "mrp": 78, "unit": "500 g", "in_stock": True}],
    "tomato": [{"id": "z-tom-1", "name": "Tomatoes 500g", "price": 28, "mrp": 30, "unit": "500 g", "in_stock": True}],
    "onion": [{"id": "z-onion-1", "name": "Onions 1kg", "price": 42, "mrp": 45, "unit": "1 kg", "in_stock": True}],
    "potato": [{"id": "z-pot-1", "name": "Potatoes 1kg", "price": 35, "mrp": 38, "unit": "1 kg", "in_stock": True}],
    "butter": [{"id": "z-but-1", "name": "Amul Butter 100g", "price": 55, "mrp": 58, "unit": "100 g", "in_stock": True}],
    "sugar": [{"id": "z-sug-1", "name": "Sugar 1kg", "price": 48, "mrp": 52, "unit": "1 kg", "in_stock": True}],
    "oil": [{"id": "z-oil-1", "name": "Fortune Sunflower Oil 1L", "price": 148, "mrp": 155, "unit": "1 L", "in_stock": True}],
    "atta": [{"id": "z-att-1", "name": "Aashirvaad Atta 5kg", "price": 255, "mrp": 270, "unit": "5 kg", "in_stock": True}],
    "yogurt": [{"id": "z-yog-1", "name": "Amul Dahi 400g", "price": 42, "mrp": 45, "unit": "400 g", "in_stock": True}],
    "curd": [{"id": "z-yog-1", "name": "Amul Dahi 400g", "price": 42, "mrp": 45, "unit": "400 g", "in_stock": True}],
    "paneer": [{"id": "z-pan-1", "name": "Amul Paneer 200g", "price": 95, "mrp": 100, "unit": "200 g", "in_stock": True}],
    "salt": [{"id": "z-salt-1", "name": "Tata Salt 1kg", "price": 22, "mrp": 24, "unit": "1 kg", "in_stock": True}],
    "tea": [{"id": "z-tea-1", "name": "Tata Tea Gold 250g", "price": 145, "mrp": 155, "unit": "250 g", "in_stock": True}],
    "coffee": [{"id": "z-cof-1", "name": "Bru Instant Coffee 100g", "price": 185, "mrp": 195, "unit": "100 g", "in_stock": True}],
    "banana": [{"id": "z-ban-1", "name": "Bananas (6 pcs)", "price": 45, "mrp": 50, "unit": "6 pcs", "in_stock": True}],
    "apple": [{"id": "z-app-1", "name": "Shimla Apples 1kg", "price": 180, "mrp": 195, "unit": "1 kg", "in_stock": True}],
}

INSTAMART_CATALOG: dict[str, list[dict]] = {
    "milk": [{"id": "im-milk-1", "name": "Nandini Toned Milk 1L", "price": 62, "mrp": 68, "unit": "1 L", "in_stock": True}],
    "bread": [{"id": "im-bread-1", "name": "Britannia White Bread 400g", "price": 42, "mrp": 45, "unit": "400 g", "in_stock": True}],
    "eggs": [{"id": "im-eggs-1", "name": "Country Eggs (6 pcs)", "price": 58, "mrp": 65, "unit": "6 pcs", "in_stock": True}],
    "rice": [{"id": "im-rice-1", "name": "India Gate Basmati Rice 1kg", "price": 125, "mrp": 140, "unit": "1 kg", "in_stock": True}],
    "dal": [{"id": "im-dal-1", "name": "Toor Dal 500g", "price": 75, "mrp": 80, "unit": "500 g", "in_stock": True}],
    "tomato": [{"id": "im-tom-1", "name": "Tomatoes 500g", "price": 25, "mrp": 30, "unit": "500 g", "in_stock": True}],
    "onion": [{"id": "im-onion-1", "name": "Onions 1kg", "price": 38, "mrp": 44, "unit": "1 kg", "in_stock": True}],
    "potato": [{"id": "im-pot-1", "name": "Potatoes 1kg", "price": 32, "mrp": 38, "unit": "1 kg", "in_stock": True}],
    "butter": [{"id": "im-but-1", "name": "Amul Butter 100g", "price": 53, "mrp": 58, "unit": "100 g", "in_stock": True}],
    "sugar": [{"id": "im-sug-1", "name": "Sugar 1kg", "price": 46, "mrp": 52, "unit": "1 kg", "in_stock": True}],
    "oil": [{"id": "im-oil-1", "name": "Fortune Sunflower Oil 1L", "price": 152, "mrp": 160, "unit": "1 L", "in_stock": True}],
    "atta": [{"id": "im-att-1", "name": "Aashirvaad Atta 5kg", "price": 248, "mrp": 270, "unit": "5 kg", "in_stock": True}],
    "yogurt": [{"id": "im-yog-1", "name": "Nandini Curd 500g", "price": 38, "mrp": 42, "unit": "500 g", "in_stock": True}],
    "curd": [{"id": "im-yog-1", "name": "Nandini Curd 500g", "price": 38, "mrp": 42, "unit": "500 g", "in_stock": True}],
    "paneer": [{"id": "im-pan-1", "name": "Milky Mist Paneer 200g", "price": 92, "mrp": 100, "unit": "200 g", "in_stock": True}],
    "salt": [{"id": "im-salt-1", "name": "Tata Salt 1kg", "price": 20, "mrp": 24, "unit": "1 kg", "in_stock": True}],
    "tea": [{"id": "im-tea-1", "name": "Red Label Tea 250g", "price": 138, "mrp": 148, "unit": "250 g", "in_stock": True}],
    "coffee": [{"id": "im-cof-1", "name": "Bru Instant Coffee 100g", "price": 180, "mrp": 195, "unit": "100 g", "in_stock": True}],
    "banana": [{"id": "im-ban-1", "name": "Bananas (6 pcs)", "price": 40, "mrp": 48, "unit": "6 pcs", "in_stock": True}],
    "apple": [{"id": "im-app-1", "name": "Himachal Apples 1kg", "price": 175, "mrp": 195, "unit": "1 kg", "in_stock": True}],
}


def _fuzzy_match(query: str, catalog: dict) -> list[dict]:
    q = query.lower().strip()
    # direct key match
    if q in catalog:
        return catalog[q]
    # substring match
    for key, products in catalog.items():
        if q in key or key in q:
            return products
    # partial word match
    q_words = q.split()
    for key, products in catalog.items():
        if any(w in key for w in q_words):
            return products
    return []


def mock_search_zepto(item_name: str) -> dict:
    results = _fuzzy_match(item_name, ZEPTO_CATALOG)
    if results:
        p = results[0]
        return {"found": True, "platform": "zepto", "query": item_name, **p}
    return {"found": False, "platform": "zepto", "query": item_name, "name": item_name}


def mock_search_instamart(item_name: str) -> dict:
    results = _fuzzy_match(item_name, INSTAMART_CATALOG)
    if results:
        p = results[0]
        return {"found": True, "platform": "instamart", "query": item_name, **p}
    return {"found": False, "platform": "instamart", "query": item_name, "name": item_name}


def mock_place_order(platform: str, cart_items: list[dict]) -> dict:
    order_id = f"{'ZPT' if platform == 'zepto' else 'IM'}-{random.randint(100000, 999999)}"
    total = sum(item.get("price", 0) * item.get("quantity", 1) for item in cart_items)
    return {
        "success": True,
        "platform": platform,
        "order_id": order_id,
        "total": total,
        "estimated_delivery": "15-20 mins",
        "message": f"Order placed successfully! Order ID: {order_id}",
    }
