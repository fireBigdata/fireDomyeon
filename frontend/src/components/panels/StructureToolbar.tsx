"use client";

export type StructureCategory = "structure" | "entrance";

type StructureToolbarProps = {
  pendingCategory: StructureCategory | null;
  onArm: (category: StructureCategory) => void;
};

const armedClass = "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-50";

export default function StructureToolbar({ pendingCategory, onArm }: StructureToolbarProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        구조물 추가
      </label>
      {pendingCategory && (
        <p className="mb-1.5 text-xs text-blue-600">
          도면을 드래그해서 구조물을 그려주세요 (Esc: 취소)
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onArm("structure")}
          className={`rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 ${
            pendingCategory === "structure" ? armedClass : "border-gray-300 bg-white"
          }`}
        >
          + 구조물 추가
        </button>
        <button
          type="button"
          onClick={() => onArm("entrance")}
          className={`rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 ${
            pendingCategory === "entrance" ? armedClass : "border-gray-300 bg-white"
          }`}
        >
          + 출입구 추가
        </button>
      </div>
    </div>
  );
}
