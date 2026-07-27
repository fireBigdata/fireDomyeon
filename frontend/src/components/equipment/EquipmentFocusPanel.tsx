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

type EquipmentFocusPanelProps = {
  name: EquipmentName;
  products: EquipmentProduct[];
  selectedValue: EquipmentSelectionValue;
  quantity: number;
  onSelect: (value: EquipmentSelectionValue) => void;
  onQuantityChange: (quantity: number) => void;
  /** Shown under the quantity input when this equipment's default quantity
   * came from the reference-only ML estimate. */
  mlEstimateNote?: string;
};

type SortOption = "recommended" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "추천순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

function sortProducts(
  products: EquipmentProduct[],
  sortOption: SortOption
): EquipmentProduct[] {
  if (sortOption === "recommended") {
    return products;
  }

  const direction = sortOption === "price-asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    if (a.price == null && b.price == null) return 0;
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return (a.price - b.price) * direction;
  });
}

/**
 * Main panel of the equipment-selection page — always focused on exactly one
 * equipment type at a time (picked via EquipmentSidebar / the 이전·다음
 * footer). "설치 안 함" is a checkbox above the grid rather than a product
 * card, since it isn't a product.
 */
export default function EquipmentFocusPanel({
  name,
  products,
  selectedValue,
  quantity,
  onSelect,
  onQuantityChange,
  mlEstimateNote,
}: EquipmentFocusPanelProps) {
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const sortedProducts = sortProducts(products, sortOption);
  const isNotInstalled = selectedValue === NONE_PRODUCT_ID;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{EQUIPMENT_ICONS[name]}</span>
          <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          정렬
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
          isNotInstalled
            ? "border-blue-600 bg-blue-50/60 text-blue-800 shadow-sm"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        <input
          type="checkbox"
          checked={isNotInstalled}
          onChange={() => onSelect(isNotInstalled ? null : NONE_PRODUCT_ID)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-600"
        />
        <span className="font-medium">이 설비 설치 안 함</span>
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            icon={product.icon}
            name={product.name}
            description={product.description}
            price={product.price}
            image={product.image}
            selected={selectedValue === product.id}
            onClick={() => onSelect(product.id)}
            quantity={selectedValue === product.id ? quantity : undefined}
            onQuantityChange={
              selectedValue === product.id ? onQuantityChange : undefined
            }
            mlEstimateNote={
              selectedValue === product.id ? mlEstimateNote : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
