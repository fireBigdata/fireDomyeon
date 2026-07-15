export type EquipmentName =
  | "소화기"
  | "스프링클러"
  | "차동식열감지기"
  | "정온식열감지기"
  | "연기감지기"
  | "비상구유도등"
  | "복도통로유도등"
  | "거실통로유도등"
  | "계단통로유도등"
  | "댐퍼"
  | "발신기"
  | "탬퍼스위치(TS)"
  | "옥내소화전";

export type EquipmentProduct = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const NONE_PRODUCT_ID = "none" as const;

/** null = 아직 선택하지 않음, NONE_PRODUCT_ID = "설치 안 함" 선택, 그 외 = 선택된 제품 id */
export type EquipmentSelectionValue = string | typeof NONE_PRODUCT_ID | null;

export type EquipmentSelectionState = Record<
  EquipmentName,
  EquipmentSelectionValue
>;

export type EquipmentSelectionSummary = Record<
  EquipmentName,
  { productId: string | null; productName: string }
>;
