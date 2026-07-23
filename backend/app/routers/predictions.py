from fastapi import APIRouter

from app.ml.predictor import predict_equipment_counts
from app.models import EquipmentCountRequest

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/equipment-counts")
def create_equipment_count_prediction(payload: EquipmentCountRequest) -> dict[str, float]:
    return predict_equipment_counts(
        payload.ground_floor_count,
        payload.basement_floor_count,
        payload.building_area_sqm,
        payload.total_floor_area_sqm,
        payload.site_area_sqm,
    )
