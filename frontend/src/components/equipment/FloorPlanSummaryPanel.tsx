"use client";

import { EXIT_LIGHT_CATEGORY_DEFAULTS, EXIT_LIGHT_CATEGORY_ORDER } from "@/constants/exitLight";
import type { FloorPlanSummary } from "@/hooks/useFloorPlanSummary";

type FloorPlanSummaryPanelProps = {
  summary: FloorPlanSummary | null;
};

export default function FloorPlanSummaryPanel({
  summary,
}: FloorPlanSummaryPanelProps) {
  if (!summary) {
    return (
      <div className="mx-6 mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        도면 분석 데이터가 없습니다. 먼저 도면 생성 페이지에서 도면을 작성해주세요.
      </div>
    );
  }

  const {
    floorCount,
    totalAreaSqm,
    totalExtinguisherCount,
    totalHeatDetectorCount,
    totalExitLightCountsByCategory,
    byFloor,
  } = summary;

  return (
    <div className="mx-6 mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">도면 분석 요약</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <SummaryStat label="층 수" value={`${floorCount}층`} />
        <SummaryStat
          label="전체 면적"
          value={`${Math.round(totalAreaSqm).toLocaleString()}㎡`}
        />
        <SummaryStat label="전체 소화기" value={`${totalExtinguisherCount}개`} />
        <SummaryStat label="전체 감지기" value={`${totalHeatDetectorCount}개`} />
        {EXIT_LIGHT_CATEGORY_ORDER.map((category) => (
          <SummaryStat
            key={category}
            label={`전체 ${EXIT_LIGHT_CATEGORY_DEFAULTS[category].label}`}
            value={`${totalExitLightCountsByCategory[category]}개`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-gray-500">층별 설비 수량</h3>
        <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-md border border-gray-100">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="px-3 py-1.5 font-medium">층</th>
                <th className="px-3 py-1.5 font-medium">소화기</th>
                <th className="px-3 py-1.5 font-medium">감지기</th>
                {EXIT_LIGHT_CATEGORY_ORDER.map((category) => (
                  <th key={category} className="px-3 py-1.5 font-medium">
                    {EXIT_LIGHT_CATEGORY_DEFAULTS[category].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byFloor.map((floor) => (
                <tr
                  key={floor.floorId}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-3 py-1.5 font-medium text-gray-800">
                    {floor.floorName}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600">
                    {floor.extinguisherCount}개
                  </td>
                  <td className="px-3 py-1.5 text-gray-600">
                    {floor.heatDetectorCount}개
                  </td>
                  {EXIT_LIGHT_CATEGORY_ORDER.map((category) => (
                    <td key={category} className="px-3 py-1.5 text-gray-600">
                      {floor.exitLightCountsByCategory[category]}개
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  );
}
