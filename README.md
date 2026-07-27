# 🏢 소방 시설물 견적 시스템 (Floor Plan MVP)

건물의 평면도를 웹에서 직접 설계하고, 도면 데이터를 기반으로 **소방 시설물을 자동 배치**하고 **설비 견적**을 산출하는 도면 설계 웹 애플리케이션입니다.

---

## 📖 프로젝트 소개

사용자가 브라우저에서 방·복도·출입구·엘리베이터·계단·장애물 등의 구조물을 여러 층(Floor)에 걸쳐 배치하고, 드래그로 이동하거나 크기를 조절하며 평면도를 그릴 수 있습니다. 도면 설계 시작 시 시설물 유형과 건축 부지 가로·세로를 입력하면 대지면적과 도면 축척이 자동으로 계산되고, 출입구는 문 여닫힘 방향(4방향)을 지정할 수 있습니다. 완성된 도면을 기반으로 소화기·감지기(열/연기)·유도등·스프링클러·옥내소화전을 NFTC(소방시설 화재안전기준) 근거 규칙에 따라 자동 배치하고, 예비/주/충압펌프·급기/배기팬·자동폐쇄장치·발신기는 AI(사전 학습된 회귀 모델)로 수량을 추정합니다. 구조물에 마우스를 올리면 가장 가까운 공동현관·비상구까지의 피난동선과 예상 대피 소요시간을 확인할 수 있습니다. 이후 설비 선택 화면에서 실제 제품 카탈로그를 기준으로 수량×단가 견적과 내화구조 공사비를 계산하고, 비용 구성을 그래프로 확인할 수 있습니다.

- **Frontend**: Next.js 기반 SPA, `react-konva`로 캔버스 렌더링
- **Backend**: FastAPI 기반 REST API, JSON 파일 저장소 + scikit-learn 기반 설비 수량 예측

> ⚠️ 이 앱은 참고용 도구입니다. 소화기/스프링클러/옥내소화전 등 설치 대상·기준 판정 로직은 건물 전체 규모(무창층·지하가 등)를 완전히 반영하지 못해 항상 "검토 필요" 경고를 함께 표시합니다. 실제 소방시설 설계·인허가 문서를 대체하지 않습니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
| --- | --- |
| 초기 설정 | 도면 설계 시작 시 시설물 유형·내화구조 여부·건축 부지 가로/세로 입력 → 대지면적·도면 축척 자동 계산 (InitialSetupModal) |
| 시설물 유형 선택 | 아파트·빌라·단독주택·상가·병원·학교·지하철역·공장·창고 9종 |
| 다층 도면 설계 | 층 추가/복제/삭제/이름 변경, 드래그로 층 순서 변경(지상/지하 경계 마커 포함), 지상/지하 층수에 따른 이름 자동 부여, 층별 구조물·설비 독립 관리 (FloorBar) |
| 구조물 생성/편집 | 방·복도·출입구·엘리베이터·계단·장애물 추가, 드래그 이동, 크기 조정, 방 내부 파티션 분할 |
| 출입구 방향 설정 | 출입구별 문 여닫힘 방향(상하좌우 4종) 지정, 캔버스에 호(Arc) 형태로 시각화 |
| 건축면적/연면적 자동화 | 층별 구조물 면적 합계를 기반으로 건축면적·연면적을 자동 계산 (AreaSummary, BuildingScaleInput) |
| 피난동선 표시 | 구조물에 마우스를 올리면 문을 통해서만 이동 가능한 최단 경로로 가장 가까운 공동현관/비상구까지의 대피 동선과 예상 대피 소요시간을 표시 |
| 단축키 | S(구조물 추가), E(출입구 추가), Delete/Backspace(선택된 구조물 삭제) |
| 소화기 자동 배치 | NFTC 101/608 근거, 능력단위 기준면적 + 20m 보행거리 초과 보강 |
| 열감지기 자동 배치 | 방 용도별 차동식/정온식 자동 선택, 내화구조 보정 |
| 연기감지기 자동 배치 | 복도·계단·승강로 간격 기준 + 공동주택 침실/거실 면적 기준 |
| 유도등 자동 배치 | 피난구·복도통로·계단통로 유도등 3종 |
| 스프링클러 자동 배치 | 헤드 수평거리 기준 그리드 배치, 위험분류(무대부/특수가연물)별 규칙 분기 |
| 옥내소화전 자동 배치 | 설치대상 간이 판정 + 25m 수평거리 기준 복도 배치 |
| 설비 수량 AI 추정 | 건물 규모 입력 → 펌프/팬/자동폐쇄장치/발신기 등 7종 수량 예측 (scikit-learn) |
| 전체 자동 배치 | 6종 도면 기반 설비를 버튼 한 번으로 일괄 배치 |
| 설비 선택/견적 | 21종 설비별 실제 제품 카탈로그에서 제품 선택, 수량×단가 합산 |
| 내화구조 공사비 | 시설유형별 ㎡당 단가 × 연면적으로 별도 산정 |
| 비용 통계/그래프 | 설비별 비용 막대그래프, 비용 구성비 도넛 차트(SVG 직접 구현), 도면 요약 테이블 |
| 도면 저장 | 저장 버튼으로 도면 상태를 백엔드에 저장 |

---

## 🛠 기술 스택

### Frontend

| 분류 | 기술 |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Library | React 19 |
| Canvas | Konva, react-konva |
| 서버 상태 관리 | TanStack Query (`@tanstack/react-query`) |
| 화면 간 데이터 전달 | localStorage 스냅샷 (`useSyncExternalStore`) |
| 차트 | 별도 라이브러리 없이 SVG 직접 구현 (막대그래프/도넛차트) |
| 테스트 | Vitest |
| Styling | Tailwind CSS 4 |
| Lint | ESLint 9 |

### Backend

| 분류 | 기술 |
| --- | --- |
| Framework | FastAPI |
| Language | Python |
| 서버 | Uvicorn |
| 데이터 검증 | Pydantic 2 |
| 설비 수량 예측 | scikit-learn, pandas, numpy, joblib (사전 학습된 `.joblib` 모델 로드) |
| 저장소 | 로컬 JSON 파일 (`backend/data/floorplans.json`) |

> ⚠️ 별도 데이터베이스는 사용하지 않으며, 저장된 도면은 서버의 JSON 파일에 기록됩니다.

---

## 📂 프로젝트 구조

```text
소방청공모전/
├── package.json                 # 루트: backend + frontend 동시 실행 스크립트
├── figure/                       # 발표/제안 자료 이미지
├── backend/
│   ├── requirements.txt
│   ├── data/
│   │   └── floorplans.json      # 도면 데이터 저장 파일 (자동 생성)
│   └── app/
│       ├── main.py              # FastAPI 앱, CORS(ALLOWED_ORIGINS), 라우터 등록, /health
│       ├── models.py            # Structure/Floor/FloorPlanState 등 Pydantic 모델
│       ├── storage.py           # JSON 파일 기반 저장/조회
│       ├── routers/
│       │   ├── floorplans.py    # /floorplans API
│       │   └── predictions.py   # /predict/equipment-counts API
│       └── ml/
│           ├── predictor.py             # joblib 모델 로드 + 예측 함수
│           └── equipment_predictor.joblib  # 사전 학습된 설비 수량 예측 모델
└── frontend/
    ├── package.json
    └── src/
        ├── app/
        │   ├── page.tsx                     # 도면 설계 화면 ("/")
        │   ├── equipment-selection/page.tsx # 설비 선택·견적 화면 ("/equipment-selection")
        │   └── providers.tsx                # React Query Provider
        ├── components/
        │   ├── canvas/     # FloorPlanCanvas, StructureShape, EntranceSwingArc,
        │   │               # HeatDetectorShape, SmokeDetectorShape, ExitLightShape,
        │   │               # SprinklerHeadShape, HydrantShape, PartitionShape 등
        │   ├── layout/     # TopBar, FloorBar(층 관리/드래그 순서변경), LeftPanel, RightPanel
        │   ├── panels/     # InitialSetupModal(초기 설정), 시설물 유형/내화구조/건물규모 입력,
        │   │               # EntranceSwingDirectionSelect(출입구 방향), EvacuationRoutePanel(피난동선),
        │   │               # 소화기·열감지기·연기감지기·유도등·스프링클러·옥내소화전 패널 등
        │   └── equipment/  # EquipmentListPanel, ProductPanel, FloorPlanSummaryPanel,
        │                   # CostSummaryPanel (설비 선택 화면 전용)
        ├── hooks/          # useFloorPlanState, useSaveFloorPlan,
        │                   # use{Extinguisher,HeatDetector,SmokeDetector,ExitLight,
        │                   # Sprinkler,Hydrant}Placement, useEquipmentSelection,
        │                   # useEquipmentCountPrediction, useFloorPlanSummary
        ├── lib/            # facilityRules, {extinguisher,heatDetector,smokeDetector,
        │                   # exitLight,sprinkler,hydrant}Placement, sprinklerRules,
        │                   # hydrantRules, obstacleAvoidance, wallHuggingPlacement,
        │                   # entrancePlacement, structureSnapping, partitionTree,
        │                   # area(면적/축척/대피시간 계산), entranceSwing(출입구 방향),
        │                   # evacuationRoute(피난동선 경로 탐색), floorOrder(층 순서/이름 자동화),
        │                   # floorPlanStorage, equipmentSelectionStorage, api
        ├── constants/      # structureDefaults, roomTypes, entranceTypes, entranceSwing,
        │                   # canvas(캔버스 크기), exitLight, heatDetectorTypes, smokeDetector,
        │                   # sprinklerHazard/Status, equipmentProducts (실제 제품 카탈로그, 일부 목업 포함)
        └── types/          # floorplan, extinguisher, heatDetector, smokeDetector,
                            # exitLight, sprinkler, hydrant, equipmentSelection
```

---

## 🚀 실행 방법

### 사전 준비

- Node.js (frontend)
- Python 3.11 (backend, `backend/.venv` 가상환경 기준)

### 1. Backend 준비

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

> `scikit-learn`/`pandas`/`numpy` 등 ML 패키지가 포함되어 있어 최초 설치 용량·시간이 늘어날 수 있습니다. 서버 기동 시 `backend/app/ml/equipment_predictor.joblib` 모델 파일을 즉시 로드하므로, 이 파일이 없으면 서버가 기동되지 않습니다(저장소에 포함되어 있음).

### 2. 루트에서 의존성 설치

```bash
npm install
npm install --prefix frontend
```

### 3. 동시 실행 (루트 디렉터리에서)

```bash
npm run dev
```

`npm run dev`는 아래 두 프로세스를 동시에 실행합니다.

| 스크립트 | 내용 | 주소 |
| --- | --- | --- |
| `dev:backend` | `uvicorn app.main:app --reload` (backend 가상환경 사용) | http://localhost:8000 |
| `dev:frontend` | `next dev` | http://localhost:3000 |

개별 실행도 가능합니다.

```bash
# backend만
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --port 8000 --reload

# frontend만
npm run dev --prefix frontend
```

> Frontend는 `NEXT_PUBLIC_API_URL` 환경변수로 API 주소를 설정할 수 있으며, 기본값은 `http://localhost:8000`입니다. Backend CORS는 `ALLOWED_ORIGINS` 환경변수(콤마 구분)로 허용 origin을 지정하며, 기본값은 `http://localhost:3000`입니다.

### 4. 테스트 (Frontend)

```bash
npm run test --prefix frontend
```

핵심 자동 배치 로직(소화기/열감지기/연기감지기/유도등/스프링클러/옥내소화전/장애물 회피/시설물 규칙)에 대한 Vitest 단위 테스트가 `frontend/src/lib/*.test.ts`에 있습니다. 백엔드 테스트는 아직 없습니다.

---

## 🖥 화면(UI) 구성

### `/` 도면 설계 화면

```text
┌───────────────────────────────────────────────────────────────┐
│  TopBar (도면 이름 / 설비 선택으로 이동 / 전체 초기화 / 저장)          │
├───────────────────────────────────────────────────────────────┤
│  FloorBar (층 탭: 추가/복제/삭제/이름변경/드래그 순서변경 / 층 초기화)   │
├───────────┬───────────────────────────────────┬───────────────┤
│           │   AreaSummary (건축면적/연면적 자동계산)  │               │
│ LeftPanel │                                     │  RightPanel   │
│ - 시설물 유형│   FloorPlanCanvas (Konva)           │ - 선택된      │
│ - 내화구조   │  - 구조물 6종, 파티션 분할              │   구조물/설비  │
│ - 건물 규모  │  - 출입구 문 여닫힘 방향 표시            │   상세 정보   │
│   입력      │  - 소화기·감지기·유도등·               │              │
│ - 전체      │    스프링클러·소화전 아이콘 렌더링         │              │
│   자동배치  │  - 호버 시 피난동선/대피 소요시간 표시      │              │
│ - 설비별    │                                     │              │
│   패널 6종  │                                     │              │
│ - 피난동선   │                                     │              │
│   표시 토글  │                                     │              │
└───────────┴───────────────────────────────────┴───────────────┘
```

- 최초 진입 시 **InitialSetupModal**(시설물 유형·내화구조·건축 부지 가로/세로 입력)이 표시되며, "나중에 설정"으로 건너뛰거나 이후 "건물 정보" 버튼으로 다시 열 수 있습니다.
- **LeftPanel**: 시설물 유형(9종) 선택, 내화구조 여부 토글, AI 예측용 건물 규모(지상/지하 층수, 건축면적, 연면적, 대지면적) 입력, 구조물 추가 툴바(단축키 S/E), "전체 자동 배치" 버튼, 소화기·열감지기·연기감지기·유도등·스프링클러·옥내소화전 패널(각각 개별 자동배치 버튼 + 결과 요약), 피난동선 표시 ON/OFF 토글
- **캔버스**: 드래그로 이동, Transformer 핸들로 크기 조정, 방 내부 파티션 분할/병합, 장애물 배치 시 자동 배치 로직이 회피, 출입구는 4방향 문 여닫힘 호(Arc) 표시, 피난동선 표시가 켜져 있으면 구조물에 마우스를 올릴 때 가장 가까운 공동현관/비상구까지의 최단 동선과 예상 대피 소요시간 표시
- **RightPanel**: 선택된 구조물의 좌표/크기/면적, 방 용도, 출입구 타입 및 여닫힘 방향, 스프링클러 위험분류 지정, 파티션 삭제/복원
- **단축키**: `S` 구조물 추가, `E` 출입구 추가, `Delete`/`Backspace` 선택된 구조물 삭제 (입력창 포커스 중이거나 Ctrl/Alt/Meta 조합 시에는 비활성)

### `/equipment-selection` 설비 선택·견적 화면

- 좌측 설비 목록(21종) + 우측 제품 카드(선택/수량 입력, AI 추정 설비는 안내 문구 표시)
- "다음" 클릭 시 **도면 요약**(층/면적/설비별 설치 개수)과 **비용 요약**(설비별 막대그래프, 비용 구성비 도넛 차트, 상세 내역표)으로 전환
- 두 화면은 React 상태를 공유하지 않고 **localStorage 스냅샷**으로 서로 데이터를 참조합니다.

---

## 🔥 소방 설비 자동 배치 로직 요약

모든 로직은 `frontend/src/lib/`에 위치하며, 근거 조문을 코드 주석에 명시합니다. 공통으로 `obstacleAvoidance.ts`(장애물 회피)와 `wallHuggingPlacement.ts`(벽면 배치)를 사용합니다.

| 설비 | 근거 | 산정 기준 |
| --- | --- | --- |
| 소화기 | NFTC 101 별표2 / NFTC 608 | 시설유형·내화구조별 능력단위 기준면적(100~400㎡)으로 개수 산정 + 20m 보행거리 초과 지점 보강 |
| 열감지기 (차동식/정온식) | NFTC 203 | 방 용도별 타입 자동 선택(주방·보일러실→정온식), 보호면적(40/15㎡, 내화구조 보정) 기준 그리드 배치, 공동주택 침실/거실 제외 |
| 연기감지기 | NFTC 203 4조 | 복도 30m·계단 15m 간격 배치 + 공동주택 침실/거실은 면적 기준(≈150㎡) 배치 |
| 유도등 | NFTC 303 | 피난구유도등(출입구별), 복도통로유도등(20m 간격+꺾임 지점), 계단통로유도등(계단별) |
| 스프링클러 | NFPC/NFTC 103 | 위험분류별 헤드 수평거리(1.7~2.6m) 기준 정사각 그리드(S=R√2) 배치, house는 설치대상 제외 |
| 옥내소화전 | NFTC 102 | 연면적 3,000㎡ 이상 또는 4층 이상+바닥면적 1,000㎡ 이상 층 존재 시 대상, 25m 수평거리 기준 복도 배치 |
| 예비/주/충압펌프, 급기/배기팬, 자동폐쇄장치, 발신기 | - | 도면 기반 배치 로직 없음. 건물 규모 5개 값을 백엔드 `/predict/equipment-counts`에 전달해 사전 학습된 회귀 모델로 수량 추정(참고용, 학습 샘플이 적어 정확도 낮음) |

> 스프링클러/옥내소화전은 보/기둥 등 실제 장애물 데이터가 부족해 배치에 성공해도 "장애물 방해 여부 확인 필요" 상태가 항상 함께 표시됩니다.

---

## ✅ 현재 구현된 기능

- [x] 초기 설정 모달 — 시설물 유형/내화구조/건축 부지 입력 → 대지면적·축척 자동 계산
- [x] 시설물 유형 선택 (9종)
- [x] 다층(Floor) 도면 설계 — 층 추가/복제/삭제/이름 변경/드래그 순서 변경
- [x] 구조물 생성/이동/크기 조정, 방 내부 파티션 분할, 장애물 배치
- [x] 출입구 문 여닫힘 방향 설정 (4방향)
- [x] 구조물별/전체 면적 계산, 건축면적/연면적 자동 계산
- [x] 피난동선 표시 및 대피 소요시간 추정
- [x] 전역 단축키 (구조물/출입구 추가, 선택 구조물 삭제)
- [x] 소화기·열감지기·연기감지기·유도등·스프링클러·옥내소화전 자동 배치 (개별 + 일괄)
- [x] 설비 수량 AI 추정(펌프/팬/자동폐쇄장치/발신기 7종)
- [x] 설비 선택 화면에서 제품 카탈로그 기반 견적 산출
- [x] 내화구조 공사비 계산
- [x] 비용 그래프/통계 (막대그래프, 도넛 차트, 도면 요약)
- [x] 도면 저장 (백엔드 API 호출 → JSON 파일 저장)
- [ ] 도면 불러오기 UI (API·클라이언트 함수는 존재하나 화면에 연결되어 있지 않음)
- [ ] 저장된 도면 목록 조회 / 삭제 API
- [ ] 백엔드 저장 스키마가 프론트 최신 필드(연기감지기, 옥내소화전, 장애물 타입, 9종 시설유형, 건물 규모 입력, 건축 부지, 층 순서, 출입구 방향 등)를 완전히 반영하지 못함 — 저장 시 최신 필드가 유실될 수 있음
- [ ] PDF 도면/견적서 출력
- [ ] 실제 데이터베이스 연동 (JSON 파일 저장소 대체)
- [ ] 사용자 인증/권한 관리

---

## 🔌 API

Base URL: `http://localhost:8000` (기본값, `NEXT_PUBLIC_API_URL`로 변경 가능)

| Method | Endpoint | 설명 | Request Body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | 서버 상태 확인 | - | `{ "status": "ok" }` |
| `POST` | `/floorplans` | 도면 생성/저장 (id 없으면 자동 생성) | `FloorPlanState` | `FloorPlanState` |
| `GET` | `/floorplans/{floor_plan_id}` | 도면 단건 조회 | - | `FloorPlanState` (없으면 `404`) |
| `POST` | `/predict/equipment-counts` | 건물 규모 기반 설비 수량 AI 추정 (7종) | `EquipmentCountRequest` | `{ "예비펌프": number, "주펌프": number, ... }` |

> 저장소는 실제 DB가 아닌 `backend/data/floorplans.json` 파일이며, 도면 목록 조회(`GET /floorplans`) 및 삭제(`DELETE`) API는 아직 없습니다.

### `EquipmentCountRequest` 스키마

```jsonc
{
  "groundFloorCount": "number",     // 지상 층수
  "basementFloorCount": "number",   // 지하 층수
  "buildingAreaSqm": "number",      // 건축면적(㎡)
  "totalFloorAreaSqm": "number",    // 연면적(㎡)
  "siteAreaSqm": "number"           // 대지면적(㎡)
}
```

예측 대상 9종(감지기·소화전 제외 7종만 반환): 예비펌프, 주펌프, 충압펌프, 급기휀, 배기휀, 자동폐쇄, 발신기.

### `FloorPlanState` 스키마 (백엔드 저장 모델 기준)

```jsonc
{
  "id": "string | null",
  "name": "string",
  "facilityType": "apartment" | "house",   // 백엔드는 2종만 정의(프론트는 9종 사용)
  "floors": [
    {
      "id": "string",
      "name": "string",
      "structures": [
        {
          "id": "string",
          "type": "room" | "corridor" | "entrance" | "elevator" | "stairs",
          "x": "number", "y": "number",
          "width": "number", "height": "number",
          "rotation": "number"
        }
      ],
      "extinguisherPlacements": [ "..." ],
      "heatDetectors": [ "..." ],
      "exitLights": [ "..." ],
      "sprinklerHeads": [ "..." ]
    }
  ],
  "currentFloorId": "string",
  "selectedStructureId": "string | null",
  "scale": "number"
}
```

> ⚠️ 위 스키마는 백엔드 `models.py` 기준이며, 프론트엔드에서 실제로 사용하는 필드(연기감지기 `smokeDetectors`, 옥내소화전 `hydrantPlacements`, 장애물 `obstacle` 구조물 타입, 9종 시설유형, 내화구조 여부, AI 예측용 건물 규모 값, 건축 부지 가로/세로, 층 순서/지상·지하 경계(`groundMarkerIndex`), 출입구 여닫힘 방향 등)를 아직 반영하지 않아 저장 시 일부 데이터가 유실될 수 있습니다.

---

## 📦 사용 라이브러리

### Frontend

- `next`, `react`, `react-dom`
- `konva`, `react-konva` — 캔버스 도형 렌더링/드래그/리사이즈
- `@tanstack/react-query` — 저장 mutation 등 서버 상태 관리
- `tailwindcss` — 스타일링
- `vitest` — 자동 배치 로직 단위 테스트
- `typescript`, `eslint` — 타입/린트

### Backend

- `fastapi` — REST API 프레임워크
- `uvicorn[standard]` — ASGI 서버
- `pydantic` — 요청/응답 데이터 검증
- `scikit-learn`, `pandas`, `numpy`, `joblib` — 설비 수량 예측 모델 로드/추론

---

## 🗺 Roadmap

- [ ] 도면 목록 조회 / 불러오기 UI
- [ ] 백엔드 저장 스키마를 프론트 최신 도면 모델과 동기화
- [ ] 스프링클러/옥내소화전 장애물(보·기둥·덕트) 데이터 모델 추가
- [ ] PDF 도면/견적서 출력
- [ ] 실제 데이터베이스 연동 (JSON 파일 저장소 대체)
- [ ] 사용자 인증/권한 관리
- [ ] 예비/주/충압펌프 실제 제품 카탈로그 확보 (현재 목업 데이터)

---

## 🎨 참고 자료

`figure/` 디렉터리에 서비스 제안 관련 이미지가 포함되어 있습니다.

- 기존서비스_제안서비스_시간단축.png — 기존 방식 대비 시간 단축 효과
- 소방설비 추천 AI 모델 학습 과정.png — 설비 수량 예측 모델 학습 파이프라인
- 소방청 공모전 - 서비스 프로세스 인포그래픽.png — 전체 서비스 프로세스

---

## 라이선스

Copyright © 2026. All rights reserved.

본 프로젝트(소스 코드, 문서, 이미지 등 일체)는 저작권법에 의해 보호됩니다. 저작권자의 사전 서면 동의 없이 무단으로 복제, 배포, 수정, 2차 저작물 작성 및 상업적 이용을 금합니다.
