from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import floorplans

app = FastAPI(title="Floor Plan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(floorplans.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
