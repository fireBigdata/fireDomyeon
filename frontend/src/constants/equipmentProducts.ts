import type { EquipmentName, EquipmentProduct } from "@/types/equipmentSelection";

export { NONE_PRODUCT_ID } from "@/types/equipmentSelection";

/**
 * 설비 선택 페이지 전용 임시(목업) 데이터입니다.
 * 실제 제품 카탈로그/DB가 연동되기 전까지 사용하는 더미 데이터이며,
 * 실제 제품 정보와 무관합니다.
 */
export const IS_MOCK_EQUIPMENT_DATA = true;

export const EQUIPMENT_LIST: EquipmentName[] = [
  "소화기",
  "스프링클러",
  "차동식열감지기",
  "정온식열감지기",
  "연기감지기",
  "비상구유도등",
  "복도통로유도등",
  "거실통로유도등",
  "계단통로유도등",
  "댐퍼",
  "발신기",
  "탬퍼스위치(TS)",
  "옥내소화전",
];

export const EQUIPMENT_ICONS: Record<EquipmentName, string> = {
  소화기: "🧯",
  스프링클러: "💧",
  차동식열감지기: "🌡️",
  정온식열감지기: "🔥",
  연기감지기: "💨",
  비상구유도등: "🚪",
  복도통로유도등: "🏃",
  거실통로유도등: "🛋️",
  계단통로유도등: "🪜",
  댐퍼: "🌀",
  발신기: "🔔",
  "탬퍼스위치(TS)": "🔧",
  옥내소화전: "🚒",
};

export const EQUIPMENT_PRODUCTS: Record<EquipmentName, EquipmentProduct[]> = {
  소화기: [
    {
      id: "extinguisher-1",
      name: "ABC 분말소화기",
      description: "일반 화재(A·B·C급)에 폭넓게 사용하는 표준 분말소화기",
      icon: "🧯",
    },
    {
      id: "extinguisher-2",
      name: "CO₂ 소화기",
      description: "전기 및 유류 화재에 적합하며 오염이 적은 이산화탄소 소화기",
      icon: "🧯",
    },
    {
      id: "extinguisher-3",
      name: "청정 소화기",
      description: "전자 장비 주변 화재에 적합한 할로겐화합물 청정소화기",
      icon: "🧯",
    },
    {
      id: "extinguisher-4",
      name: "축압식 소화기",
      description: "압력 게이지로 상태 확인이 쉬운 축압식 분말소화기",
      icon: "🧯",
    },
  ],
  스프링클러: [
    {
      id: "sprinkler-1",
      name: "일반형 스프링클러",
      description: "표준 감열부를 사용하는 범용 자동 소화 설비",
      icon: "💧",
    },
    {
      id: "sprinkler-2",
      name: "조기반응형 스프링클러",
      description: "화재 초기 단계에서 빠르게 반응하는 조기반응형(ESFR) 헤드",
      icon: "💧",
    },
    {
      id: "sprinkler-3",
      name: "측벽형 스프링클러",
      description: "벽면에 설치해 좁은 공간에 적합한 측벽형 헤드",
      icon: "💧",
    },
  ],
  차동식열감지기: [
    {
      id: "heat-differential-1",
      name: "차동식 스팟형 1종",
      description: "온도 상승률을 감지하는 표준형 차동식 감지기",
      icon: "🌡️",
    },
    {
      id: "heat-differential-2",
      name: "차동식 스팟형 2종",
      description: "일반 사무 공간에 적합한 보급형 차동식 감지기",
      icon: "🌡️",
    },
    {
      id: "heat-differential-3",
      name: "차동식 분포형",
      description: "넓은 면적을 감지 회로로 연결하는 분포형 차동식 감지기",
      icon: "🌡️",
    },
  ],
  정온식열감지기: [
    {
      id: "heat-fixed-1",
      name: "정온식 스팟형 특종",
      description: "고온이 발생하는 주방 등에 적합한 특종 정온식 감지기",
      icon: "🔥",
    },
    {
      id: "heat-fixed-2",
      name: "정온식 스팟형 1종",
      description: "일정 온도 이상에서 작동하는 표준형 정온식 감지기",
      icon: "🔥",
    },
    {
      id: "heat-fixed-3",
      name: "방수형 정온식 감지기",
      description: "습기가 많은 장소에 적합한 방수형 정온식 감지기",
      icon: "🔥",
    },
  ],
  연기감지기: [
    {
      id: "smoke-1",
      name: "광전식 스팟형 연기감지기",
      description: "산란광 방식을 사용하는 표준 연기감지기",
      icon: "💨",
    },
    {
      id: "smoke-2",
      name: "이온화식 연기감지기",
      description: "미세한 연기 입자에도 민감하게 반응하는 이온화식 감지기",
      icon: "💨",
    },
    {
      id: "smoke-3",
      name: "축적형 연기감지기",
      description: "오작동을 줄이기 위해 신호를 축적해 판단하는 감지기",
      icon: "💨",
    },
  ],
  비상구유도등: [
    {
      id: "exit-light-1",
      name: "표준형 비상구유도등",
      description: "출입구 상단에 설치하는 기본형 비상구 유도등",
      icon: "🚪",
    },
    {
      id: "exit-light-2",
      name: "축광형 비상구유도등",
      description: "정전 시에도 잔광으로 식별이 가능한 축광형 유도등",
      icon: "🚪",
    },
    {
      id: "exit-light-3",
      name: "매입형 비상구유도등",
      description: "천장이나 벽에 매립해 설치하는 매입형 유도등",
      icon: "🚪",
    },
  ],
  복도통로유도등: [
    {
      id: "corridor-light-1",
      name: "표준형 복도통로유도등",
      description: "복도 벽면에 설치하는 기본형 통로유도등",
      icon: "🏃",
    },
    {
      id: "corridor-light-2",
      name: "바닥매입형 복도통로유도등",
      description: "바닥에 매립해 시야를 가리지 않는 통로유도등",
      icon: "🏃",
    },
    {
      id: "corridor-light-3",
      name: "고휘도 복도통로유도등",
      description: "긴 복도에서도 식별이 쉬운 고휘도 통로유도등",
      icon: "🏃",
    },
  ],
  거실통로유도등: [
    {
      id: "room-passage-light-1",
      name: "표준형 거실통로유도등",
      description: "거실 및 개방 공간 통로에 설치하는 기본형 유도등",
      icon: "🛋️",
    },
    {
      id: "room-passage-light-2",
      name: "천장형 거실통로유도등",
      description: "천장에 부착해 넓은 공간을 비추는 유도등",
      icon: "🛋️",
    },
    {
      id: "room-passage-light-3",
      name: "슬림형 거실통로유도등",
      description: "인테리어에 어울리는 슬림한 디자인의 유도등",
      icon: "🛋️",
    },
  ],
  계단통로유도등: [
    {
      id: "stair-light-1",
      name: "표준형 계단통로유도등",
      description: "계단실 벽면에 설치하는 기본형 통로유도등",
      icon: "🪜",
    },
    {
      id: "stair-light-2",
      name: "단수표시형 계단통로유도등",
      description: "층수와 단수를 함께 표시해주는 계단통로유도등",
      icon: "🪜",
    },
    {
      id: "stair-light-3",
      name: "축광형 계단통로유도등",
      description: "정전 시 잔광으로 계단 식별이 가능한 축광형 유도등",
      icon: "🪜",
    },
  ],
  댐퍼: [
    {
      id: "damper-1",
      name: "방화댐퍼",
      description: "화재 확산을 막기 위해 덕트를 자동 차단하는 방화댐퍼",
      icon: "🌀",
    },
    {
      id: "damper-2",
      name: "방연댐퍼",
      description: "연기 확산을 막기 위해 설치하는 방연댐퍼",
      icon: "🌀",
    },
    {
      id: "damper-3",
      name: "모터구동형 댐퍼",
      description: "제어반 신호로 자동 개폐되는 모터구동형 댐퍼",
      icon: "🌀",
    },
  ],
  발신기: [
    {
      id: "transmitter-1",
      name: "표준형 발신기",
      description: "수동으로 화재 신호를 발신하는 기본형 발신기",
      icon: "🔔",
    },
    {
      id: "transmitter-2",
      name: "발신기(응답램프 내장형)",
      description: "신호 수신 여부를 램프로 확인 가능한 발신기",
      icon: "🔔",
    },
    {
      id: "transmitter-3",
      name: "매입형 발신기",
      description: "벽면에 매립 설치하는 발신기",
      icon: "🔔",
    },
  ],
  "탬퍼스위치(TS)": [
    {
      id: "tamper-switch-1",
      name: "표준형 탬퍼스위치",
      description: "밸브 개폐 상태를 감시하는 기본형 탬퍼스위치",
      icon: "🔧",
    },
    {
      id: "tamper-switch-2",
      name: "방수형 탬퍼스위치",
      description: "옥외 배관에 적합한 방수형 탬퍼스위치",
      icon: "🔧",
    },
    {
      id: "tamper-switch-3",
      name: "무선형 탬퍼스위치",
      description: "배선 없이 상태 신호를 전송하는 무선형 탬퍼스위치",
      icon: "🔧",
    },
  ],
  옥내소화전: [
    {
      id: "indoor-hydrant-1",
      name: "1호 옥내소화전함",
      description: "일반 건물에 적용하는 표준 1호 소화전함",
      icon: "🚒",
    },
    {
      id: "indoor-hydrant-2",
      name: "2호 옥내소화전함",
      description: "협소한 공간에 적합한 2호 소화전함",
      icon: "🚒",
    },
    {
      id: "indoor-hydrant-3",
      name: "호스릴 옥내소화전함",
      description: "한 사람이 조작하기 쉬운 호스릴 방식 소화전함",
      icon: "🚒",
    },
  ],
};
