"use client";

type ProductCardProps = {
  icon: string;
  name: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export default function ProductCard({
  icon,
  name,
  description,
  selected,
  onClick,
}: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
          ✓
        </span>
      )}
      <span className="text-2xl">{icon}</span>
      <span className="font-medium text-gray-900">{name}</span>
      <span className="text-sm text-gray-500">{description}</span>
    </button>
  );
}
