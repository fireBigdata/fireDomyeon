"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import { EQUIPMENT_ICONS } from "@/constants/equipmentProducts";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";
import type {
  EquipmentName,
  EquipmentProduct,
  EquipmentSelectionValue,
} from "@/types/equipmentSelection";

type EquipmentAccordionItemProps = {
  name: EquipmentName;
  products: EquipmentProduct[];
  selectedValue: EquipmentSelectionValue;
  onSelect: (value: EquipmentSelectionValue) => void;
};

export default function EquipmentAccordionItem({
  name,
  products,
  selectedValue,
  onSelect,
}: EquipmentAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isSelected = selectedValue !== null;
  const statusLabel =
    selectedValue === null
      ? "선택 필요"
      : selectedValue === NONE_PRODUCT_ID
        ? "설치 안 함"
        : (products.find((product) => product.id === selectedValue)?.name ??
          "");

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{EQUIPMENT_ICONS[name]}</span>
          <span className="font-medium text-gray-900">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm ${
              isSelected ? "text-blue-600" : "text-gray-400"
            }`}
          >
            {statusLabel}
          </span>
          <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              icon={product.icon}
              name={product.name}
              description={product.description}
              selected={selectedValue === product.id}
              onClick={() => onSelect(product.id)}
            />
          ))}
          <ProductCard
            icon="🚫"
            name="설치 안 함"
            description="이 설비를 설치하지 않습니다"
            selected={selectedValue === NONE_PRODUCT_ID}
            onClick={() => onSelect(NONE_PRODUCT_ID)}
          />
        </div>
      )}
    </div>
  );
}
