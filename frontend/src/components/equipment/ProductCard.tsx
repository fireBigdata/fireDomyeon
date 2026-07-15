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
}: ProductCardProps) {
  return (
    <div className="flex w-44 flex-shrink-0 flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`flex w-full flex-col items-start gap-2 rounded-lg border p-4 text-left transition ${
          selected
            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        {image ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-md bg-gray-100">
            <span className="text-5xl">{icon}</span>
          </div>
        )}
        <span className="font-medium text-gray-900">{name}</span>
        <span className="text-sm text-gray-500">{description}</span>
        {price != null && (
          <span className="text-sm font-semibold text-gray-800">
            {price.toLocaleString()}원
          </span>
        )}
      </button>

      {selected && onQuantityChange && (
        <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
          설치 개수
          <input
            type="number"
            min={1}
            value={quantity ?? 1}
            onChange={(e) => {
              const next = Number(e.target.value);
              onQuantityChange(Number.isNaN(next) ? 1 : Math.max(1, next));
            }}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      )}
    </div>
  );
}
