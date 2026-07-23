"use client";

type AutoPlaceAllButtonProps = {
  onAutoPlaceAll: () => void;
};

export default function AutoPlaceAllButton({ onAutoPlaceAll }: AutoPlaceAllButtonProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        전체 소방설비 자동 배치
      </label>
      <button
        type="button"
        onClick={onAutoPlaceAll}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        소방설비 자동 배치
      </button>
    </div>
  );
}
