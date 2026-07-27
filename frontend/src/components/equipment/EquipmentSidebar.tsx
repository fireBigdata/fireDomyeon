"use client";

import { useState } from "react";
import { EQUIPMENT_ICONS, EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";
import type { EquipmentName, EquipmentSelectionState } from "@/types/equipmentSelection";

type EquipmentSidebarProps = {
  requiredEquipmentList: EquipmentName[];
  optionalEquipmentList: EquipmentName[];
  selection: EquipmentSelectionState;
  activeEquipment: EquipmentName | null;
  onSelectEquipment: (name: EquipmentName) => void;
};

type StatusGroup = "done" | "current" | "pending";

const STATUS_GROUP_ORDER: StatusGroup[] = ["done", "current", "pending"];

const STATUS_GROUP_LABEL: Record<StatusGroup, string> = {
  done: "완료",
  current: "현재 선택",
  pending: "미선택",
};

const STATUS_GROUP_DOT: Record<StatusGroup, string> = {
  done: "🟢",
  current: "🟡",
  pending: "⚪",
};

function statusOf(
  name: EquipmentName,
  selection: EquipmentSelectionState,
  activeEquipment: EquipmentName | null
): StatusGroup {
  if (name === activeEquipment) return "current";
  return selection[name] !== null ? "done" : "pending";
}

function EquipmentRow({
  name,
  selection,
  isActive,
  onSelect,
}: {
  name: EquipmentName;
  selection: EquipmentSelectionState;
  isActive: boolean;
  onSelect: (name: EquipmentName) => void;
}) {
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

  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className={`flex w-full min-w-0 items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className="mt-0.5 shrink-0 text-base">{EQUIPMENT_ICONS[name]}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        <span className={`truncate text-xs ${isActive ? "text-blue-600" : "text-gray-400"}`}>
          {statusLabel}
        </span>
      </span>
    </button>
  );
}

function AccordionSection({
  title,
  equipmentList,
  selection,
  activeEquipment,
  onSelectEquipment,
}: {
  title: string;
  equipmentList: EquipmentName[];
  selection: EquipmentSelectionState;
  activeEquipment: EquipmentName | null;
  onSelectEquipment: (name: EquipmentName) => void;
}) {
  const [open, setOpen] = useState(true);

  const groups: Record<StatusGroup, EquipmentName[]> = { done: [], current: [], pending: [] };
  equipmentList.forEach((name) => {
    groups[statusOf(name, selection, activeEquipment)].push(name);
  });

  return (
    <div className="border-b border-gray-100 py-2 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
      >
        <span>
          {title} · {equipmentList.length}
        </span>
        <span className={`transition-transform duration-150 ${open ? "" : "-rotate-90"}`}>▼</span>
      </button>

      {open && equipmentList.length > 0 && (
        <div className="mt-1 flex flex-col gap-2 px-1">
          {STATUS_GROUP_ORDER.map((status) =>
            groups[status].length === 0 ? null : (
              <div key={status} className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 px-3 text-[11px] font-medium text-gray-400">
                  <span aria-hidden="true">{STATUS_GROUP_DOT[status]}</span>
                  {STATUS_GROUP_LABEL[status]}
                </span>
                {groups[status].map((name) => (
                  <EquipmentRow
                    key={name}
                    name={name}
                    selection={selection}
                    isActive={name === activeEquipment}
                    onSelect={onSelectEquipment}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Left rail for the equipment-selection page — icon + name + status only
 * (see EquipmentFocusPanel for the actual product picker). Equipment is
 * split into two collapsible sections (필수/선택 설비), each internally
 * grouped by status so 완료/현재 선택/미선택 read at a glance.
 */
export default function EquipmentSidebar({
  requiredEquipmentList,
  optionalEquipmentList,
  selection,
  activeEquipment,
  onSelectEquipment,
}: EquipmentSidebarProps) {
  return (
    <nav className="flex w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white px-2 py-3">
      <AccordionSection
        title="필수 설비"
        equipmentList={requiredEquipmentList}
        selection={selection}
        activeEquipment={activeEquipment}
        onSelectEquipment={onSelectEquipment}
      />
      <AccordionSection
        title="선택 설비"
        equipmentList={optionalEquipmentList}
        selection={selection}
        activeEquipment={activeEquipment}
        onSelectEquipment={onSelectEquipment}
      />
    </nav>
  );
}
