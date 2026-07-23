"use client";

import { useState } from "react";
import type {
  EquipmentName,
  EquipmentSelectionSummary,
} from "@/types/equipmentSelection";

export type FireResistantConstructionCostInfo = {
  amount: number;
  ratePerM2: number;
  totalAreaSqm: number;
  facilityTypeLabel: string;
};

type CostSummaryPanelProps = {
  equipmentList: EquipmentName[];
  summary: EquipmentSelectionSummary;
  totalCost: number;
  /** Null when the floor plan isn't marked as fire-resistant (내화구조) — no construction-cost line item applies. */
  fireResistantConstructionCost: FireResistantConstructionCostInfo | null;
};

// Slate, distinct from the equipment categorical palette, so the
// construction-cost line item never gets confused with an equipment item.
const CONSTRUCTION_COST_COLOR = "#64748b";
const CONSTRUCTION_COST_LABEL = "내화구조 공사비";

const BAR_COLOR = "#2a78d6";
const BAR_COLOR_HOVER = "#256abf";

// 고정 순서 카테고리 팔레트(8색). 설비 이름 → 색상 매핑은 EQUIPMENT_LIST의 순서로
// 고정하여, 선택 상태가 바뀌어도 같은 설비는 항상 같은 색을 유지하도록 한다.
const CATEGORICAL_COLORS = [
  "#2a78d6",
  "#008300",
  "#e87ba4",
  "#eda100",
  "#1baf7a",
  "#eb6834",
  "#4a3aa7",
  "#e34948",
];

// 팔레트 8색을 넘어서는 설비(9번째 이후)는 같은 순서의 색을 옅게 섞어 사용한다.
// "기타"로 묶지 않고 선택한 설비를 모두 표시하기 위함이며, 범례에 항상 이름·값이
// 직접 표기되므로 색만으로 구분에 의존하지 않는다.
function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function colorForIndex(index: number): string {
  const hue = CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
  const tier = Math.floor(index / CATEGORICAL_COLORS.length);
  return tier === 0 ? hue : lightenHex(hue, tier * 0.3);
}

const DONUT_RADIUS = 45;
const DONUT_STROKE = 18;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_GAP = 3;

export default function CostSummaryPanel({
  equipmentList,
  summary,
  totalCost,
  fireResistantConstructionCost,
}: CostSummaryPanelProps) {
  const [hovered, setHovered] = useState<EquipmentName | null>(null);
  const [hoveredConstruction, setHoveredConstruction] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const rows = equipmentList.map((name) => ({ name, ...summary[name] }));

  const pricedRows = rows
    .filter((row) => row.lineTotal != null && row.lineTotal > 0)
    .sort((a, b) => (b.lineTotal ?? 0) - (a.lineTotal ?? 0));

  const pendingRows = rows.filter(
    (row) => row.productId !== null && row.productPrice === null
  );

  const unselectedCount = rows.filter((row) => row.productId === null).length;
  const confirmedCount = pricedRows.length;

  const hasConstructionCost = (fireResistantConstructionCost?.amount ?? 0) > 0;
  const hasAnyCostRow = pricedRows.length > 0 || hasConstructionCost;

  const maxValue = Math.max(
    ...pricedRows.map((row) => row.lineTotal ?? 0),
    fireResistantConstructionCost?.amount ?? 0,
    1
  );

  const colorByEquipment: Partial<Record<EquipmentName, string>> = {};
  equipmentList.forEach((name, index) => {
    colorByEquipment[name] = colorForIndex(index);
  });

  const slices = pricedRows
    .map((row) => ({
      key: row.name as string,
      label: row.name as string,
      value: row.lineTotal ?? 0,
      color: colorByEquipment[row.name] as string,
    }))
    .concat(
      hasConstructionCost
        ? [
            {
              key: CONSTRUCTION_COST_LABEL,
              label: CONSTRUCTION_COST_LABEL,
              value: fireResistantConstructionCost!.amount,
              color: CONSTRUCTION_COST_COLOR,
            },
          ]
        : []
    )
    .sort((a, b) => b.value - a.value);

  const { result: drawnSlices } = slices.reduce<{
    cumulative: number;
    result: Array<(typeof slices)[number] & {
      share: number;
      start: number;
      dash: number;
    }>;
  }>(
    (acc, slice) => {
      const share = totalCost > 0 ? slice.value / totalCost : 0;
      const trueLength = share * DONUT_CIRCUMFERENCE;
      const dash = Math.max(trueLength - DONUT_GAP, 0);
      return {
        cumulative: acc.cumulative + trueLength,
        result: [
          ...acc.result,
          { ...slice, share, start: acc.cumulative, dash },
        ],
      };
    },
    { cumulative: 0, result: [] }
  );

  return (
    <div className="mx-6 mt-6 flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">비용 요약</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
          <span className="text-xs text-blue-700">전체 비용</span>
          <span className="text-xl font-semibold text-blue-900 tabular-nums">
            {totalCost.toLocaleString()}원
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">가격 산정 완료</span>
          <span className="text-base font-semibold text-gray-900 tabular-nums">
            {confirmedCount}/{equipmentList.length}개 설비
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">미선택 설비</span>
          <span className="text-base font-semibold text-gray-900 tabular-nums">
            {unselectedCount}개
          </span>
        </div>
      </div>

      {pendingRows.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span aria-hidden="true">⚠</span>
          <span>
            {pendingRows.map((row) => row.name).join(", ")} 항목은 아직 가격이
            정해지지 않아 전체 비용에 포함되지 않았습니다.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-gray-500">설비별 비용</h3>
        {!hasAnyCostRow ? (
          <p className="rounded-md border border-gray-100 bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">
            가격이 확정된 선택 항목이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {hasConstructionCost && (
              <div
                tabIndex={0}
                className="group relative flex items-center gap-3 outline-none"
                onMouseEnter={() => setHoveredConstruction(true)}
                onMouseLeave={() => setHoveredConstruction(false)}
                onFocus={() => setHoveredConstruction(true)}
                onBlur={() => setHoveredConstruction(false)}
              >
                <div className="w-24 shrink-0 truncate text-xs text-gray-600" title={CONSTRUCTION_COST_LABEL}>
                  {CONSTRUCTION_COST_LABEL}
                </div>
                <div className="relative h-6 flex-1 rounded bg-gray-100">
                  <div
                    className="h-6 rounded-r-[4px] transition-colors"
                    style={{
                      width: `${(fireResistantConstructionCost!.amount / maxValue) * 100}%`,
                      backgroundColor: CONSTRUCTION_COST_COLOR,
                    }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-xs font-medium text-gray-800 tabular-nums">
                  {fireResistantConstructionCost!.amount.toLocaleString()}원
                </div>

                {hoveredConstruction && (
                  <div className="absolute -top-9 left-24 z-10 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-md">
                    <span className="font-semibold text-gray-900">
                      {fireResistantConstructionCost!.amount.toLocaleString()}원
                    </span>{" "}
                    · {fireResistantConstructionCost!.facilityTypeLabel} ·{" "}
                    {fireResistantConstructionCost!.ratePerM2.toLocaleString()}원/㎡ ×{" "}
                    {fireResistantConstructionCost!.totalAreaSqm.toFixed(1)}㎡
                  </div>
                )}
              </div>
            )}
            {pricedRows.map((row) => (
              <div
                key={row.name}
                tabIndex={0}
                className="group relative flex items-center gap-3 outline-none"
                onMouseEnter={() => setHovered(row.name)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(row.name)}
                onBlur={() => setHovered(null)}
              >
                <div
                  className="w-24 shrink-0 truncate text-xs text-gray-600"
                  title={row.name}
                >
                  {row.name}
                </div>
                <div className="relative h-6 flex-1 rounded bg-gray-100">
                  <div
                    className="h-6 rounded-r-[4px] transition-colors"
                    style={{
                      width: `${((row.lineTotal ?? 0) / maxValue) * 100}%`,
                      backgroundColor:
                        hovered === row.name ? BAR_COLOR_HOVER : BAR_COLOR,
                    }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-xs font-medium text-gray-800 tabular-nums">
                  {(row.lineTotal ?? 0).toLocaleString()}원
                </div>

                {hovered === row.name && (
                  <div className="absolute -top-9 left-24 z-10 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-md">
                    <span className="font-semibold text-gray-900">
                      {(row.lineTotal ?? 0).toLocaleString()}원
                    </span>{" "}
                    · {row.productName} · {row.productPrice?.toLocaleString()}
                    원 × {row.quantity}개
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-gray-500">비용 구성비</h3>
        {slices.length === 0 ? (
          <p className="rounded-md border border-gray-100 bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">
            가격이 확정된 선택 항목이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <svg
              viewBox="0 0 120 120"
              className="h-40 w-40 shrink-0 -rotate-90"
            >
              <circle
                cx={60}
                cy={60}
                r={DONUT_RADIUS}
                fill="none"
                stroke="#e1e0d9"
                strokeWidth={DONUT_STROKE}
              />
              {drawnSlices.map((slice) => (
                <circle
                  key={slice.key}
                  cx={60}
                  cy={60}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={`${slice.dash} ${DONUT_CIRCUMFERENCE - slice.dash}`}
                  strokeDashoffset={-slice.start}
                  className="transition-opacity duration-150"
                  style={{
                    opacity:
                      hoveredSlice && hoveredSlice !== slice.key ? 0.35 : 1,
                  }}
                  onMouseEnter={() => setHoveredSlice(slice.key)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              ))}
              <text
                x={60}
                y={57}
                textAnchor="middle"
                transform="rotate(90 60 60)"
                className="fill-gray-900 text-[13px] font-semibold"
              >
                {totalCost.toLocaleString()}원
              </text>
              <text
                x={60}
                y={70}
                textAnchor="middle"
                transform="rotate(90 60 60)"
                className="fill-gray-500 text-[7px]"
              >
                전체 비용
              </text>
            </svg>

            <ul className="flex w-full flex-col gap-1.5">
              {drawnSlices.map((slice) => (
                <li
                  key={slice.key}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredSlice(slice.key)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onFocus={() => setHoveredSlice(slice.key)}
                  onBlur={() => setHoveredSlice(null)}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs outline-none transition-colors"
                  style={{
                    backgroundColor:
                      hoveredSlice === slice.key ? "#f4f3f1" : "transparent",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="flex-1 truncate text-gray-700" title={slice.label}>
                    {slice.label}
                  </span>
                  <span className="shrink-0 font-medium text-gray-800 tabular-nums">
                    {slice.value.toLocaleString()}원
                  </span>
                  <span className="w-10 shrink-0 text-right text-gray-500 tabular-nums">
                    {Math.round(slice.share * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-gray-500">설비별 상세 내역</h3>
        <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-md border border-gray-100">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="px-3 py-1.5 font-medium">설비</th>
                <th className="px-3 py-1.5 font-medium">제품</th>
                <th className="px-3 py-1.5 font-medium">단가</th>
                <th className="px-3 py-1.5 font-medium">수량</th>
                <th className="px-3 py-1.5 font-medium">소계</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-3 py-1.5 font-medium text-gray-800">
                    {row.name}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600">
                    {row.productName}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 tabular-nums">
                    {row.productPrice != null
                      ? `${row.productPrice.toLocaleString()}원`
                      : "-"}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 tabular-nums">
                    {row.quantity > 0 ? `${row.quantity}개` : "-"}
                  </td>
                  <td className="px-3 py-1.5 font-medium text-gray-800 tabular-nums">
                    {row.lineTotal != null
                      ? `${row.lineTotal.toLocaleString()}원`
                      : "-"}
                  </td>
                </tr>
              ))}
              {hasConstructionCost && (
                <tr className="border-b border-gray-100 last:border-0 bg-slate-50/60">
                  <td className="px-3 py-1.5 font-medium text-gray-800">
                    {CONSTRUCTION_COST_LABEL}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600">
                    {fireResistantConstructionCost!.facilityTypeLabel} 기준
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 tabular-nums">
                    {fireResistantConstructionCost!.ratePerM2.toLocaleString()}원/㎡
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 tabular-nums">
                    {fireResistantConstructionCost!.totalAreaSqm.toFixed(1)}㎡
                  </td>
                  <td className="px-3 py-1.5 font-medium text-gray-800 tabular-nums">
                    {fireResistantConstructionCost!.amount.toLocaleString()}원
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td
                  className="px-3 py-2 text-right font-semibold text-gray-700"
                  colSpan={4}
                >
                  전체 비용
                </td>
                <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums">
                  {totalCost.toLocaleString()}원
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
