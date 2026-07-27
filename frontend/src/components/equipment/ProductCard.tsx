"use client";

import { useState } from "react";
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

/**
 * Photo/name/price만 기본으로 보여주고, 설명은 "상세보기"를 눌러야 펼쳐지는
 * 카드 — 선택은 카드 영역 어디를 눌러도 일어나고, "상세보기"/설치 개수
 * 입력만 각자의 동작으로 분리되어 있어 선택을 트리거하지 않는다.
 */
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        selected
          ? "border-blue-600 bg-blue-50/60 shadow-md"
          : "border-gray-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="relative">
        {image ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100">
            <span className="text-5xl">{icon}</span>
          </div>
        )}
        {selected && (
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
            ✓
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span
          className={`text-sm font-medium leading-snug ${selected ? "text-blue-900" : "text-gray-900"}`}
        >
          {name}
        </span>
        {price != null && (
          <span className="text-sm font-semibold text-gray-800">{price.toLocaleString()}원</span>
        )}
      </div>

      <span
        className={`rounded-lg px-3 py-1.5 text-center text-sm font-medium transition ${
          selected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
        }`}
      >
        {selected ? "선택됨" : "선택"}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className="flex items-center justify-center gap-1 py-0.5 text-xs text-gray-400 transition hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {expanded ? "상세 접기" : "상세보기"}
        <span className={`transition-transform duration-150 ${expanded ? "-rotate-180" : ""}`}>▾</span>
      </button>

      {expanded && (
        <p className="rounded-lg bg-gray-50 p-2.5 text-xs leading-relaxed text-gray-600">
          {description}
        </p>
      )}

      {selected && onQuantityChange && (
        <div
          className="flex flex-col gap-1 border-t border-blue-100 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
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
              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          {mlEstimateNote && <p className="text-xs text-amber-600">{mlEstimateNote}</p>}
        </div>
      )}
    </div>
  );
}
