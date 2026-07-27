"use client";

import { Fragment } from "react";
import { EQUIPMENT_ICONS } from "@/constants/equipmentProducts";
import type { EquipmentName } from "@/types/equipmentSelection";

type RequiredEquipmentSummaryTableProps = {
  items: { name: EquipmentName; count: number }[];
};

// Equipment/count pairs per table row — keeps the table a few rows tall
// instead of one row per item, so it reads as a small at-a-glance summary
// rather than a tall list.
const COLUMNS = 4;

function chunk<T>(list: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

/**
 * Small at-a-glance table of every equipment this floor plan/AI estimate
 * actually calls for and how many — sits above the two selection panes so
 * the user can see the full required list without clicking through each
 * equipment type one by one.
 */
export default function RequiredEquipmentSummaryTable({
  items,
}: RequiredEquipmentSummaryTableProps) {
  const rows = chunk(items, COLUMNS);

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-2">
      <h3 className="mb-1 text-xs font-semibold text-gray-500">
        설치 필수 설비 ({items.length}종)
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">아직 필수로 계산된 설비가 없습니다.</p>
      ) : (
        <div className="max-h-32 overflow-y-auto rounded-md border border-gray-100">
          <table className="w-full text-xs">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-50 last:border-0 even:bg-gray-50">
                  {row.map(({ name, count }) => (
                    <Fragment key={name}>
                      <td className="whitespace-nowrap px-3 py-1 text-gray-700">
                        <span className="mr-1.5">{EQUIPMENT_ICONS[name]}</span>
                        {name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1 pr-6 text-right font-semibold text-emerald-700">
                        {count}개
                      </td>
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
