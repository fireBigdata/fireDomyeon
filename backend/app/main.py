import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import floorplans, predictions

app = FastAPI(title="Floor Plan API")

allowed_origins = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(floorplans.router)
app.include_router(predictions.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
