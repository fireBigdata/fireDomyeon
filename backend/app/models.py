from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field

StructureType = Literal["room", "corridor", "entrance", "elevator", "stairs"]
FacilityType = Literal["apartment", "house"]
RoomType = Literal["LIVING", "KITCHEN", "BOILER", "HALLWAY"]
EntranceType = Literal["COMMON", "EMERGENCY", "DOOR"]
HeatDetectorType = Literal["DIFFERENTIAL", "FIXED_TEMPERATURE"]
PartitionDirection = Literal["vertical", "horizontal"]
ExitLightCategory = Literal["EXIT", "CORRIDOR", "STAIRS"]
SprinklerHazardClass = Literal["NONE", "SPECIAL_COMBUSTIBLE", "STAGE"]
SprinklerHeadType = Literal["STANDARD_CLOSED", "RESIDENTIAL", "OPEN"]


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
    # Only meaningful when type == "room". Special sprinkler hazard
    # classification (NFTC 103 2.2.1); see app's sprinkler rule engine.
    sprinkler_hazard: Optional[SprinklerHazardClass] = Field(
        default=None, alias="sprinklerHazard"
    )

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


class SprinklerHead(BaseModel):
    id: str
    floor_id: str = Field(alias="floorId")
    room_id: str = Field(alias="roomId")
    # Set when placed inside a specific partition leaf rather than the whole room.
    partition_id: Optional[str] = Field(default=None, alias="partitionId")
    x: float
    y: float
    head_type: SprinklerHeadType = Field(alias="headType")
    is_auto_placed: bool = Field(alias="isAutoPlaced")
    # Id of the rule (lib/sprinklerRules.ts) applied when placing this head.
    rule_id: str = Field(alias="ruleId")
    # The horizontal-distance criterion (R, in meters) applied to this head.
    horizontal_distance_m: float = Field(alias="horizontalDistanceM")

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
    sprinkler_heads: list[SprinklerHead] = Field(
        default_factory=list, alias="sprinklerHeads"
    )

    model_config = {"populate_by_name": True}


class EquipmentCountRequest(BaseModel):
    # Building-scale inputs for the equipment-count predictor (see
    # app/ml/predictor.py) — user-entered, independent of the floor plan's
    # drawn structures/area.
    ground_floor_count: float = Field(alias="groundFloorCount")
    basement_floor_count: float = Field(alias="basementFloorCount")
    building_area_sqm: float = Field(alias="buildingAreaSqm")
    total_floor_area_sqm: float = Field(alias="totalFloorAreaSqm")
    site_area_sqm: float = Field(alias="siteAreaSqm")

    model_config = {"populate_by_name": True}


class FloorPlanState(BaseModel):
    id: Optional[str] = None
    name: str
    facility_type: FacilityType = Field(alias="facilityType")
    # Whether the building's structure is fire-resistant (내화구조); used by
    # the sprinkler rule engine. None = not yet confirmed by the user.
    is_fire_resistant_structure: Optional[bool] = Field(
        default=None, alias="isFireResistantStructure"
    )
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
    selected_sprinkler_head_id: Optional[str] = Field(
        default=None, alias="selectedSprinklerHeadId"
    )
    scale: float = 1

    model_config = {"populate_by_name": True}
