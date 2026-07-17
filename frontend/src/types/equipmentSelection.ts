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
  | "옥내소화전"
  | "탬퍼스위치"
  | "압력스위치"
  | "유수검지스위치"
  | "예비펌프"
  | "주펌프"
  | "충압펌프"
  | "급기팬"
  | "배기팬"
  | "자동폐쇄장치";

export type EquipmentProduct = {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 제품 가격(원). 아직 정해지지 않았으면 null */
  price: number | null;
  /** public/images/equipment/ 안의 이미지 경로 (예: "/images/equipment/extinguisher-1.jpg"). 없으면 null */
  image: string | null;
  /**
   * 다른 기능(자동 배치 계산 등)이 참조하는 제품별 고유 정수 값.
   * 설비마다 의미가 다름 (예: 소화기 = 능력단위). 아직 정해지지 않았으면 null
   */
  abilityUnit: number | null;
};

export const NONE_PRODUCT_ID = "none" as const;

/** null = 아직 선택하지 않음, NONE_PRODUCT_ID = "설치 안 함" 선택, 그 외 = 선택된 제품 id */
export type EquipmentSelectionValue = string | typeof NONE_PRODUCT_ID | null;

export type EquipmentSelectionState = Record<
  EquipmentName,
  EquipmentSelectionValue
>;

/** 설비별 설치 개수. "설치 안 함"/미선택은 0, 제품 선택 시 기본값 1 */
export type EquipmentQuantityState = Record<EquipmentName, number>;

export type EquipmentSelectionSummary = Record<
  EquipmentName,
  {
    productId: string | null;
    productName: string;
    productPrice: number | null;
    quantity: number;
    lineTotal: number | null;
  }
>;
