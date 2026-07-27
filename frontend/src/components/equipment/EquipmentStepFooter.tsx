"use client";

type EquipmentStepFooterProps = {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  nextLabel: string;
};

/**
 * 이전/다음 navigation for stepping through equipment one at a time. On the
 * last equipment, the caller passes nextLabel="선택 완료" and onNext moves to
 * the summary view instead of advancing further.
 */
export default function EquipmentStepFooter({
  currentIndex,
  total,
  onPrev,
  onNext,
  nextLabel,
}: EquipmentStepFooterProps) {
  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          이전
        </button>

        <span className="text-sm text-gray-400 tabular-nums">
          {total > 0 ? currentIndex + 1 : 0} / {total}
        </span>

        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
