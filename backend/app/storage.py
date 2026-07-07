import json
from pathlib import Path

from app.models import FloorPlanState

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_FILE = DATA_DIR / "floorplans.json"


def _load_all() -> dict[str, dict]:
    if not DATA_FILE.exists():
        return {}
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def _save_all(records: dict[str, dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def save_floor_plan(floor_plan: FloorPlanState) -> FloorPlanState:
    records = _load_all()
    records[floor_plan.id] = floor_plan.model_dump(by_alias=True)
    _save_all(records)
    return floor_plan


def get_floor_plan(floor_plan_id: str) -> FloorPlanState | None:
    records = _load_all()
    record = records.get(floor_plan_id)
    if record is None:
        return None
    return FloorPlanState(**record)
