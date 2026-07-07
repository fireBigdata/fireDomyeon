from typing import Literal, Optional

from pydantic import BaseModel, Field

StructureType = Literal["room", "corridor", "entrance", "elevator", "stairs"]
FacilityType = Literal["apartment", "house"]


class Structure(BaseModel):
    id: str
    type: StructureType
    x: float
    y: float
    width: float
    height: float
    rotation: Optional[float] = 0


class FloorPlanState(BaseModel):
    id: Optional[str] = None
    name: str
    facility_type: FacilityType = Field(alias="facilityType")
    structures: list[Structure] = Field(default_factory=list)
    selected_structure_id: Optional[str] = Field(
        default=None, alias="selectedStructureId"
    )
    scale: float = 1

    model_config = {"populate_by_name": True}
