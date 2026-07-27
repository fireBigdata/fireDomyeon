"use client";

export type EquipmentSummaryItem = {
  icon: string;
  label: string;
  count: number;
};

type EquipmentSummaryModalProps = {
  items: EquipmentSummaryItem[];
  onClose: () => void;
  onConfirm: () => void;
};

/** Shown right before navigating to the equipment-selection screen, so the
 * user sees exactly how many of each auto-placed equipment the current
 * floor plan calls for, with the actual "다음" action living inside this
 * same box (see page.tsx's "설비 선택으로 이동" button). */
export default function EquipmentSummaryModal({
  items,
  onClose,
  onConfirm,
}: EquipmentSummaryModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900">필요한 설비 수량</h2>
        <p className="mt-1 text-sm text-gray-500">
          현재 도면 기준으로 자동 배치된 설비 수량입니다.
        </p>

        <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-gray-100">
          {items.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">
                    {item.count}개
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              아직 자동 배치된 설비가 없습니다.
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            다음으로 넘어가기
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
