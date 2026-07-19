"use client";

type FireResistanceToggleProps = {
  isFireResistantStructure: boolean;
  onChange: (value: boolean) => void;
};

/** Shared 내화구조 flag, shown above every auto-placement panel — it affects
 * 소화기(능력단위 기준면적), 감지기(보호면적), 스프링클러(수평거리 기준) all at once. */
export default function FireResistanceToggle({
  isFireResistantStructure,
  onChange,
}: FireResistanceToggleProps) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={isFireResistantStructure}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-gray-600">건물 구조가 내화구조입니다</span>
    </label>
  );
}
