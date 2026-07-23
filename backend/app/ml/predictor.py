from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent / "equipment_predictor.joblib"

# Order the model was trained on (fireBigdata/fire-equipment-predictor,
# notebooks/apt_equipment_model.ipynb). The model itself only stores an
# array of 9 predictions with no column labels, so this order must be kept
# in sync with that notebook's FEATURES/TARGETS lists by hand.
FEATURES = ["지상층수", "지하층수", "건축면적", "연면적", "대지면적"]
TARGETS = [
    "감지기",
    "소화전",
    "예비펌프",
    "주펌프",
    "충압펌프",
    "급기휀",
    "배기휀",
    "자동폐쇄",
    "발신기",
]

# Only these 7 have no drawing-based auto-placement logic in this app yet
# (감지기/소화전 are already computed from NFTC formulas elsewhere and are
# intentionally excluded here) — maps the model's training-data column name
# to this app's EquipmentName literal.
TARGET_TO_EQUIPMENT_NAME = {
    "예비펌프": "예비펌프",
    "주펌프": "주펌프",
    "충압펌프": "충압펌프",
    "급기휀": "급기팬",
    "배기휀": "배기팬",
    "자동폐쇄": "자동폐쇄장치",
    "발신기": "발신기",
}

_model = joblib.load(MODEL_PATH)


def predict_equipment_counts(
    ground_floor_count: float,
    basement_floor_count: float,
    building_area_sqm: float,
    total_floor_area_sqm: float,
    site_area_sqm: float,
) -> dict[str, float]:
    """Predicts installed counts for the 7 equipment types this app has no
    placement logic for, from building-scale inputs. Reference-only estimate:
    the underlying model was trained on 99 samples (see fire-equipment-predictor's
    docs/모델_학습_보고서.md) and is not accurate enough to replace a real count.
    """
    x = pd.DataFrame(
        [
            [
                ground_floor_count,
                basement_floor_count,
                building_area_sqm,
                total_floor_area_sqm,
                site_area_sqm,
            ]
        ],
        columns=FEATURES,
    )
    raw = dict(zip(TARGETS, _model.predict(x)[0]))
    return {
        equipment_name: max(0.0, round(float(raw[target]), 1))
        for target, equipment_name in TARGET_TO_EQUIPMENT_NAME.items()
    }
