from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field

StructureType = Literal["room", "corridor", "entrance", "elevator", "stairs"]
FacilityType = Literal["apartment", "house"]
RoomType = Literal["LIVING", "KITCHEN", "BOILER", "HALLWAY"]
EntranceType = Literal["COMMON", "EMERGENCY", "DOOR"]
HeatDetectorType = Literal["DIFFERENTIAL", "FIXED_TEMPERATURE"]
PartitionDirection = Literal["vertical", "horizontal"]
ExitLightCategory = Literal["EXIT", "CORRIDOR", "STAIRS"]


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
    # Only meaningful when type == "entrance".
    entrance_type: Optional[EntranceType] = Field(default=None, alias="entranceType")

    model_config = {"populate_by_name": True}


class ExtinguisherPlacement(BaseModel):
    id: str
    x: float
    y: float
    extinguisher_type_id: str = Field(alias="extinguisherTypeId")
    # Room or corridor this placement belongs to; used to cascade-delete when
    # that structure is removed.
    structure_id: Optional[str] = Field(default=None, alias="structureId")
    is_auto_placed: bool = Field(default=True, alias="isAutoPlaced")

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
    type: HeatDetectorType
    is_auto_placed: bool = Field(alias="isAutoPlaced")

    model_config = {"populate_by_name": True}


class ExitLight(BaseModel):
    id: str
    floor_id: str = Field(alias="floorId")
    # Structure (entrance/corridor/room/stairs) this light was placed for.
    structure_id: str = Field(alias="structureId")
    category: ExitLightCategory
    x: float
    y: float
    # True when placed to satisfy the mandatory bend/turn rule, not the
    # regular spacing rule.
    is_bend_point: bool = Field(alias="isBendPoint")
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
    exit_lights: list[ExitLight] = Field(default_factory=list, alias="exitLights")

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
    selected_exit_light_id: Optional[str] = Field(
        default=None, alias="selectedExitLightId"
    )
    scale: float = 1

    model_config = {"populate_by_name": True}
