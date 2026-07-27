"use client";

import Image from "next/image";

type ProductCardProps = {
  icon: string;
  name: string;
  description: string;
  price?: number | null;
  image?: string | null;
  selected: boolean;
  onClick: () => void;
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
  /** Shown under the quantity input when this quantity was pre-filled from
   * the reference-only ML estimate (see hooks/useEquipmentCountPrediction). */
  mlEstimateNote?: string;
};

export default function ProductCard({
  icon,
  name,
  description,
  price,
  image,
  selected,
  onClick,
  quantity,
  onQuantityChange,
  mlEstimateNote,
}: ProductCardProps) {
  return (
    <div className="flex w-44 flex-shrink-0 flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`relative flex w-full scale-100 flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition ${
          selected
            ? "border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-500 ring-offset-2"
            : "border-transparent bg-white ring-1 ring-gray-200 hover:ring-gray-300"
        }`}
      >
        {selected && (
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
            ✓
          </span>
        )}
        {image ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-md bg-gray-100">
            <span className="text-5xl">{icon}</span>
          </div>
        )}
        <span className={`font-medium ${selected ? "text-blue-800" : "text-gray-900"}`}>
          {name}
        </span>
        {price != null && (
          <span className="text-sm font-semibold text-gray-800">
            {price.toLocaleString()}원
          </span>
        )}
        <span className="text-sm text-gray-500">{description}</span>
        {selected && (
          <span className="mt-0.5 text-xs font-semibold text-blue-600">선택됨</span>
        )}
      </button>

      {selected && onQuantityChange && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
            설치 개수
            <input
              type="number"
              min={0}
              value={quantity ?? 0}
              onChange={(e) => {
                const next = Number(e.target.value);
                onQuantityChange(Number.isNaN(next) ? 0 : Math.max(0, next));
              }}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          {mlEstimateNote && (
            <p className="text-xs text-amber-600">{mlEstimateNote}</p>
          )}
        </div>
      )}
    </div>
  );
}
