"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { FacilityType } from "@/types/floorplan";
import FacilityTypeSelect from "./FacilityTypeSelect";

type InitialSetupModalProps = {
  facilityType: FacilityType;
  onFacilityTypeChange: (value: FacilityType) => void;
  onConfirm: (siteWidthM: number, siteHeightM: number) => void;
  onSkip: () => void;
};

/** Centered form shown once, right after the design page loads, so the user
 * can set 시설물 유형 and the building site's 가로/세로 before drawing —
 * used to compute 대지면적 and adjust the drawing's pixel↔meter ratio. */
export default function InitialSetupModal({
  facilityType,
  onFacilityTypeChange,
  onConfirm,
  onSkip,
}: InitialSetupModalProps) {
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");

  const width = Number(widthInput);
  const height = Number(heightInput);
  const isValid = widthInput !== "" && heightInput !== "" && width > 0 && height > 0;
  const siteArea = isValid ? width * height : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onConfirm(width, height);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold text-gray-900">도면 설계 시작하기</h2>
        <p className="mt-1 text-xs text-gray-500">
          시설물 유형과 건축 부지의 가로·세로 길이를 입력하면 대지면적과 도면
          비율이 자동으로 계산됩니다.
        </p>

        <div className="mt-4">
          <FacilityTypeSelect value={facilityType} onChange={onFacilityTypeChange} />
        </div>

        <div className="mt-3 flex gap-2">
          <label className="flex-1 text-xs font-medium text-gray-500">
            가로 (m)
            <input
              type="number"
              min={0}
              step="0.1"
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
              placeholder="예: 20"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex-1 text-xs font-medium text-gray-500">
            세로 (m)
            <input
              type="number"
              min={0}
              step="0.1"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              placeholder="예: 15"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          대지면적:{" "}
          {siteArea !== null ? `${siteArea.toFixed(1)} ㎡` : "가로·세로를 입력하세요"}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
          >
            나중에 설정
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            시작하기
          </button>
        </div>
      </form>
    </div>
  );
}
