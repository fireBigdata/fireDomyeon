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

type ProductPanelProps = {
  name: EquipmentName;
  products: EquipmentProduct[];
  selectedValue: EquipmentSelectionValue;
  quantity: number;
  onSelect: (value: EquipmentSelectionValue) => void;
  onQuantityChange: (quantity: number) => void;
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

export default function ProductPanel({
  name,
  products,
  selectedValue,
  quantity,
  onSelect,
  onQuantityChange,
}: ProductPanelProps) {
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const sortedProducts = sortProducts(products, sortOption);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
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
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <ProductCard
          icon="🚫"
          name="설치 안 함"
          description="이 설비를 설치하지 않습니다"
          selected={selectedValue === NONE_PRODUCT_ID}
          onClick={() => onSelect(NONE_PRODUCT_ID)}
        />
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
          />
        ))}
      </div>
    </div>
  );
}
