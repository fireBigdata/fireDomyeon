"use client";

import { useState } from "react";
import { EQUIPMENT_LIST, EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import EquipmentAccordionItem from "@/components/equipment/EquipmentAccordionItem";

export default function EquipmentSelectionPage() {
  const { selection, selectProduct, isComplete, summary } =
    useEquipmentSelection();
  const [submitted, setSubmitted] = useState(false);

  const completedCount = EQUIPMENT_LIST.filter(
    (name) => selection[name] !== null
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">설비 선택</h1>
        <p className="mt-1 text-gray-500">
          설비별로 사용할 제품을 선택해주세요.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {EQUIPMENT_LIST.map((name) => (
            <EquipmentAccordionItem
              key={name}
              name={name}
              products={EQUIPMENT_PRODUCTS[name]}
              selectedValue={selection[name]}
              onSelect={(value) => {
                selectProduct(name, value);
                setSubmitted(false);
              }}
            />
          ))}
        </div>

        {submitted && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium">선택이 완료되었습니다.</p>
            <ul className="mt-2 space-y-1">
              {EQUIPMENT_LIST.map((name) => (
                <li key={name}>
                  {name}: {summary[name].productName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-sm text-gray-500">
            {completedCount}/{EQUIPMENT_LIST.length}개 설비 선택 완료
          </span>
          <button
            type="button"
            disabled={!isComplete}
            onClick={() => setSubmitted(true)}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
