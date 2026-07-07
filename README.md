# 🏢 소방 시설물 견적 시스템 (Floor Plan MVP)

건물(아파트·주택)의 평면도를 웹에서 직접 설계하고, 구조물을 배치·수정하며 면적을 계산하는 **도면 설계 웹 애플리케이션**입니다.
소방 시설물 자동 배치, 설비 견적 산출, 대피 경로 생성 등 소방 도메인 기능으로 확장하기 위한 **MVP 1단계**입니다.

> 현재 저장소에는 **평면도 설계(캔버스) 기능**만 구현되어 있으며, 소방 관련 기능(자동 배치·견적·대피 경로·PDF 출력)은 아직 구현되지 않았습니다. 자세한 내용은 [Roadmap](#-roadmap) 참고.

---

## 📖 프로젝트 소개

사용자가 브라우저에서 방·복도·출입구·엘리베이터·계단 등의 구조물을 캔버스에 배치하고, 드래그로 이동하거나 크기를 조절하면서 평면도를 그릴 수 있습니다. 구조물별 면적과 전체 면적이 실시간으로 계산되며, 완성된 도면은 백엔드 API를 통해 저장할 수 있습니다.

- **Frontend**: Next.js 기반 SPA, `react-konva`로 캔버스 렌더링
- **Backend**: FastAPI 기반 REST API, JSON 파일 저장소

---

## ✨ 주요 기능

| 기능 | 설명 |
| --- | --- |
| 시설물 유형 선택 | 아파트 / 주택 중 선택 (도면 메타데이터로 저장) |
| 구조물 생성 | 방 · 복도 · 출입구 · 엘리베이터 · 계단 5종 추가 |
| 구조물 이동 | 캔버스에서 드래그로 위치 이동 |
| 구조물 크기 조정 | Transformer 핸들 드래그 또는 우측 패널 숫자 입력으로 width/height 조정 |
| 면적 계산 | 구조물별 면적 및 전체 면적(scale 반영) 실시간 계산 |
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
| Styling | Tailwind CSS 4 |
| Lint | ESLint 9 |

### Backend

| 분류 | 기술 |
| --- | --- |
| Framework | FastAPI |
| Language | Python |
| 서버 | Uvicorn |
| 데이터 검증 | Pydantic 2 |
| 저장소 | 로컬 JSON 파일 (`backend/data/floorplans.json`) |

> ⚠️ 별도 데이터베이스는 사용하지 않으며, 저장된 도면은 서버의 JSON 파일에 기록됩니다.

---

## 📂 프로젝트 구조

```text
소방청공모전/
├── package.json                # 루트: backend + frontend 동시 실행 스크립트
├── backend/
│   ├── requirements.txt
│   ├── data/
│   │   └── floorplans.json     # 도면 데이터 저장 파일 (자동 생성)
│   └── app/
│       ├── main.py             # FastAPI 앱, CORS, 라우터 등록, /health
│       ├── models.py           # Structure, FloorPlanState (Pydantic)
│       ├── storage.py          # JSON 파일 기반 저장/조회
│       └── routers/
│           └── floorplans.py   # /floorplans API
└── frontend/
    ├── package.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx        # 메인 화면 (도면 편집기)
        │   └── providers.tsx   # React Query Provider
        ├── components/
        │   ├── canvas/
        │   │   ├── FloorPlanCanvas.tsx        # Konva Stage/Layer/Transformer
        │   │   ├── DynamicFloorPlanCanvas.tsx # SSR 비활성 dynamic import
        │   │   └── StructureShape.tsx         # 구조물 도형(드래그/리사이즈)
        │   ├── layout/
        │   │   ├── TopBar.tsx        # 도면 이름, 저장 버튼
        │   │   ├── LeftPanel.tsx     # 시설물 유형 선택 + 구조물 추가 툴바
        │   │   └── RightPanel.tsx    # 선택된 구조물 정보
        │   └── panels/
        │       ├── AreaSummary.tsx
        │       ├── FacilityTypeSelect.tsx
        │       ├── StructureInfoPanel.tsx
        │       └── StructureToolbar.tsx
        ├── hooks/
        │   ├── useFloorPlanState.ts   # 도면 클라이언트 상태 관리
        │   └── useSaveFloorPlan.ts    # 저장 mutation (React Query)
        ├── lib/
        │   ├── api.ts                 # 백엔드 API 클라이언트
        │   └── structureFactory.ts    # 구조물 생성 팩토리
        ├── constants/
        │   └── structureDefaults.ts   # 구조물 타입별 기본 크기/색상
        └── types/
            └── floorplan.ts           # 공통 타입 정의
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

> Frontend는 `NEXT_PUBLIC_API_URL` 환경변수로 API 주소를 설정할 수 있으며, 기본값은 `http://localhost:8000`입니다. Backend CORS는 `http://localhost:3000`만 허용합니다.

---

## 🖥 화면(UI) 구성

메인 화면(`/`)은 3분할 레이아웃으로 구성됩니다.

```text
┌─────────────────────────────────────────────┐
│  TopBar (도면 이름 입력 / 저장 버튼)              │
├───────────┬───────────────────────┬─────────┤
│           │   AreaSummary          │         │
│ LeftPanel │  (구조물 개수 / 전체 면적) │ RightPanel │
│ - 시설물 유형 │                       │ - 선택된  │
│   선택      │   FloorPlanCanvas     │   구조물 │
│ - 구조물    │  (Konva 캔버스, 900x600) │   정보    │
│   추가 툴바  │                       │ (x, y,  │
│           │                       │  width, │
│           │                       │  height,│
│           │                       │  면적)   │
└───────────┴───────────────────────┴─────────┘
```

- **LeftPanel**: 시설물 유형(아파트/주택) 선택 드롭다운, 구조물 5종 추가 버튼
- **캔버스**: 드래그로 이동, Transformer 핸들로 크기 조정, 빈 영역 클릭 시 선택 해제
- **RightPanel**: 선택된 구조물의 좌표(읽기 전용), width/height(숫자 입력으로 수정 가능), 계산된 면적 표시

---

## ✅ 현재 구현된 기능

- [x] 시설물 유형 선택 (아파트 / 주택)
- [x] 구조물 생성 (방 / 복도 / 출입구 / 엘리베이터 / 계단)
- [x] 구조물 드래그 이동
- [x] 구조물 크기 조정 (캔버스 Transformer + 우측 패널 숫자 입력)
- [x] 구조물별/전체 면적 계산
- [x] 구조물 선택 및 선택 해제
- [x] 도면 저장 (백엔드 API 호출 → JSON 파일 저장)
- [ ] 도면 불러오기 UI (API·클라이언트 함수는 존재하나 화면에 연결되어 있지 않음)
- [ ] 저장된 도면 목록 조회
- [ ] 구조물 삭제
- [ ] 구조물 회전 (데이터 필드는 존재하나 Transformer의 회전 기능은 비활성화됨)

---

## 🔌 API

Base URL: `http://localhost:8000` (기본값, `NEXT_PUBLIC_API_URL`로 변경 가능)

| Method | Endpoint | 설명 | Request Body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | 서버 상태 확인 | - | `{ "status": "ok" }` |
| `POST` | `/floorplans` | 도면 생성/저장 (id 없으면 자동 생성) | `FloorPlanState` | `FloorPlanState` |
| `GET` | `/floorplans/{floor_plan_id}` | 도면 단건 조회 | - | `FloorPlanState` (없으면 `404`) |

### `FloorPlanState` 스키마

```jsonc
{
  "id": "string | null",          // 없으면 서버에서 UUID 생성
  "name": "string",
  "facilityType": "apartment" | "house",
  "structures": [
    {
      "id": "string",
      "type": "room" | "corridor" | "entrance" | "elevator" | "stairs",
      "x": "number",
      "y": "number",
      "width": "number",
      "height": "number",
      "rotation": "number (기본값 0)"
    }
  ],
  "selectedStructureId": "string | null",
  "scale": "number (기본값 1)"
}
```

> 저장소는 실제 DB가 아닌 `backend/data/floorplans.json` 파일이며, 도면 목록 조회(`GET /floorplans`) 및 삭제(`DELETE`) API는 아직 없습니다.

---

## 📦 사용 라이브러리

### Frontend

- `next`, `react`, `react-dom`
- `konva`, `react-konva` — 캔버스 도형 렌더링/드래그/리사이즈
- `@tanstack/react-query` — 저장 mutation 등 서버 상태 관리
- `tailwindcss` — 스타일링
- `typescript`, `eslint` — 타입/린트

### Backend

- `fastapi` — REST API 프레임워크
- `uvicorn[standard]` — ASGI 서버
- `pydantic` — 요청/응답 데이터 검증

---

## 🗺 Roadmap

- [ ] 도면 목록 조회 / 불러오기 UI
- [ ] 구조물 삭제 및 회전 UI
- [ ] 소방 시설물 자동 배치
- [ ] 소방 설비 견적 계산
- [ ] 대피 경로 생성
- [ ] PDF 도면 출력
- [ ] 실제 데이터베이스 연동 (JSON 파일 저장소 대체)
- [ ] 사용자 인증/권한 관리

## 🔮 향후 확장 계획

MVP 1단계(도면 설계 기본 기능)를 기반으로, 이후 단계에서는 배치된 구조물 정보를 활용해 소방 시설물(소화기, 스프링클러, 감지기 등)을 자동으로 배치하고 관련 설비 견적을 산출하는 기능을 추가할 예정입니다. 이어서 화재 발생 시 대피 경로를 산출하고, 최종 도면과 견적서를 PDF로 출력하는 기능까지 확장할 계획입니다.

---

## 라이선스

라이선스가 아직 지정되지 않았습니다.
