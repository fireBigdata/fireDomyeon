"use client";

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

export default function ProductPanel({
  name,
  products,
  selectedValue,
  quantity,
  onSelect,
  onQuantityChange,
}: ProductPanelProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{EQUIPMENT_ICONS[name]}</span>
        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <ProductCard
          icon="🚫"
          name="설치 안 함"
          description="이 설비를 설치하지 않습니다"
          selected={selectedValue === NONE_PRODUCT_ID}
          onClick={() => onSelect(NONE_PRODUCT_ID)}
        />
        {products.map((product) => (
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
