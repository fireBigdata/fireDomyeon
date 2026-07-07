"use client";

type TopBarProps = {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function TopBar({
  name,
  onNameChange,
  onSave,
  isSaving,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-gray-800 hover:border-gray-300 focus:border-gray-300 focus:outline-none"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>
    </header>
  );
}
