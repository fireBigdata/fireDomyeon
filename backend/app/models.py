from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field

StructureType = Literal["room", "corridor", "entrance", "elevator", "stairs"]
FacilityType = Literal["apartment", "house"]
RoomType = Literal["LIVING", "KITCHEN", "BOILER", "HALLWAY"]
PartitionDirection = Literal["vertical", "horizontal"]


class PartitionLeaf(BaseModel):
    kind: Literal["leaf"] = "leaf"
    id: str


class PartitionEmpty(BaseModel):
    # A deleted region: keeps its slot in the tree but renders as a hole,
    # allowing non-rectangular room shapes.
    kind: Literal["empty"] = "empty"
    id: str


class PartitionSplit(BaseModel):
    kind: Literal["split"] = "split"
    id: str
    direction: PartitionDirection
    ratio: float
    children: list["PartitionNode"]


PartitionNode = Annotated[
    Union[PartitionLeaf, PartitionEmpty, PartitionSplit], Field(discriminator="kind")
]
PartitionSplit.model_rebuild()


class Structure(BaseModel):
    id: str
    type: StructureType
    x: float
    y: float
    width: float
    height: float
    rotation: Optional[float] = 0
    # Only meaningful when type == "room".
    room_type: Optional[RoomType] = Field(default=None, alias="roomType")
    partitions: Optional[PartitionNode] = None

    model_config = {"populate_by_name": True}


class ExtinguisherPlacement(BaseModel):
    id: str
    x: float
    y: float
    extinguisher_type_id: str = Field(alias="extinguisherTypeId")

    model_config = {"populate_by_name": True}


class HeatDetector(BaseModel):
    id: str
    floor_id: str = Field(alias="floorId")
    room_id: str = Field(alias="roomId")
    # Set when placed inside a specific partition leaf rather than the whole room.
    partition_id: Optional[str] = Field(default=None, alias="partitionId")
    x: float
    y: float
    coverage_area: float = Field(alias="coverageArea")
    is_auto_placed: bool = Field(alias="isAutoPlaced")

    model_config = {"populate_by_name": True}


class Floor(BaseModel):
    id: str
    name: str
    structures: list[Structure] = Field(default_factory=list)
    extinguisher_placements: list[ExtinguisherPlacement] = Field(
        default_factory=list, alias="extinguisherPlacements"
    )
    heat_detectors: list[HeatDetector] = Field(
        default_factory=list, alias="heatDetectors"
    )

    model_config = {"populate_by_name": True}


class FloorPlanState(BaseModel):
    id: Optional[str] = None
    name: str
    facility_type: FacilityType = Field(alias="facilityType")
    floors: list[Floor] = Field(default_factory=list)
    current_floor_id: str = Field(alias="currentFloorId")
    selected_structure_id: Optional[str] = Field(
        default=None, alias="selectedStructureId"
    )
    selected_partition_id: Optional[str] = Field(
        default=None, alias="selectedPartitionId"
    )
    selected_heat_detector_id: Optional[str] = Field(
        default=None, alias="selectedHeatDetectorId"
    )
    scale: float = 1

    model_config = {"populate_by_name": True}
