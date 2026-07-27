"use client";

import { EQUIPMENT_ICONS, EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";
import type {
  EquipmentName,
  EquipmentSelectionState,
} from "@/types/equipmentSelection";

type EquipmentListPanelProps = {
  equipmentList: EquipmentName[];
  selection: EquipmentSelectionState;
  activeEquipment: EquipmentName | null;
  onSelectEquipment: (name: EquipmentName) => void;
};

export default function EquipmentListPanel({
  equipmentList,
  selection,
  activeEquipment,
  onSelectEquipment,
}: EquipmentListPanelProps) {
  return (
    <nav className="flex w-56 flex-shrink-0 flex-col gap-1 overflow-y-auto border-r border-gray-200 bg-white p-3">
      {equipmentList.map((name) => {
        const value = selection[name];
        const selectedProduct =
          value !== null && value !== NONE_PRODUCT_ID
            ? EQUIPMENT_PRODUCTS[name].find((product) => product.id === value)
            : undefined;
        const statusLabel =
          value === null
            ? "선택 필요"
            : value === NONE_PRODUCT_ID
              ? "설치 안 함"
              : (selectedProduct?.name ?? "");
        const isActive = name === activeEquipment;

        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelectEquipment(name)}
            onMouseEnter={() => onSelectEquipment(name)}
            className={`flex flex-col gap-0.5 rounded-md px-3 py-2 text-left transition ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <span className="text-lg">{EQUIPMENT_ICONS[name]}</span>
              {name}
            </span>
            <span
              className={`text-xs ${
                value === null ? "text-gray-400" : "text-blue-600"
              }`}
            >
              {statusLabel}
              {selectedProduct?.price != null &&
                ` · ${selectedProduct.price.toLocaleString()}원`}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
