import uuid

from fastapi import APIRouter, HTTPException

from app.models import FloorPlanState
from app.storage import get_floor_plan, save_floor_plan

router = APIRouter(prefix="/floorplans", tags=["floorplans"])


@router.post("", response_model=FloorPlanState)
def create_floor_plan(floor_plan: FloorPlanState) -> FloorPlanState:
    floor_plan.id = floor_plan.id or str(uuid.uuid4())
    return save_floor_plan(floor_plan)


@router.get("/{floor_plan_id}", response_model=FloorPlanState)
def read_floor_plan(floor_plan_id: str) -> FloorPlanState:
    floor_plan = get_floor_plan(floor_plan_id)
    if floor_plan is None:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan
