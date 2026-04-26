from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import pathlib

from agent import GroceryAgent

app = FastAPI(title="Grocery Price Comparator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = GroceryAgent()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GroceryItem(BaseModel):
    name: str
    quantity: int = 1
    unit: Optional[str] = None


class CompareRequest(BaseModel):
    items: list[GroceryItem]


class OrderRequest(BaseModel):
    platform: str
    cart_items: list[dict]


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "mock_mode": os.getenv("USE_MOCK_PROVIDERS", "true").lower() == "true"}


@app.post("/api/compare")
async def compare_prices(request: CompareRequest):
    if not request.items:
        raise HTTPException(status_code=400, detail="No items provided")
    result = await agent.compare_prices([item.model_dump() for item in request.items])
    if "error" in result and "items" not in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@app.post("/api/order")
async def place_order(request: OrderRequest):
    if request.platform not in ("zepto", "instamart"):
        raise HTTPException(status_code=400, detail="platform must be 'zepto' or 'instamart'")
    result = await agent.place_order(request.platform, request.cart_items)
    if "error" in result and "order_id" not in result:
        raise HTTPException(status_code=500, detail=result.get("error", "Order failed"))
    return result


# ---------------------------------------------------------------------------
# Serve frontend build (production)
# ---------------------------------------------------------------------------

FRONTEND_DIST = pathlib.Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(str(index))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
