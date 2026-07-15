"use client";

import { useState } from "react";
import { EQUIPMENT_LIST, EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import EquipmentListPanel from "@/components/equipment/EquipmentListPanel";
import ProductPanel from "@/components/equipment/ProductPanel";

export default function EquipmentSelectionPage() {
  const { selection, quantities, selectProduct, setQuantity, summary, totalCost } =
    useEquipmentSelection();
  const [submitted, setSubmitted] = useState(false);
  const [activeEquipment, setActiveEquipment] = useState(EQUIPMENT_LIST[0]);

  const completedCount = EQUIPMENT_LIST.filter(
    (name) => selection[name] !== null
  ).length;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">설비 선택</h1>
        <p className="mt-1 text-gray-500">
          설비별로 사용할 제품을 선택해주세요.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <EquipmentListPanel
          equipmentList={EQUIPMENT_LIST}
          selection={selection}
          activeEquipment={activeEquipment}
          onSelectEquipment={setActiveEquipment}
        />

        <div className="flex-1 overflow-y-auto">
          <ProductPanel
            name={activeEquipment}
            products={EQUIPMENT_PRODUCTS[activeEquipment]}
            selectedValue={selection[activeEquipment]}
            quantity={quantities[activeEquipment]}
            onSelect={(value) => {
              selectProduct(activeEquipment, value);
              setSubmitted(false);
            }}
            onQuantityChange={(quantity) => {
              setQuantity(activeEquipment, quantity);
              setSubmitted(false);
            }}
          />

          {submitted && (
            <div className="mx-6 mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium">선택이 완료되었습니다.</p>
              <ul className="mt-2 space-y-1">
                {EQUIPMENT_LIST.map((name) => (
                  <li key={name}>
                    {name}: {summary[name].productName}
                    {summary[name].quantity > 0 &&
                      ` · ${summary[name].quantity}개`}
                    {summary[name].lineTotal != null &&
                      ` (${summary[name].lineTotal.toLocaleString()}원)`}
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-semibold">
                전체 비용: {totalCost.toLocaleString()}원
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm text-gray-500">
            {completedCount}/{EQUIPMENT_LIST.length}개 설비 선택 완료
          </span>
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
