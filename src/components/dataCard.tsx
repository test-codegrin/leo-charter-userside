// components/DataCard.tsx

interface DataCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export default function DataCard({ title, value, className="" }: DataCardProps) {
  return (
    <div className={`flex flex-col pl-2 pt-6 ${className}`}>
      <p className="font-sans text-sm text-palette-secondary mb-1">{title}</p>
      <p className="font-sans text-white text-sm">{value || "-"}</p>
    </div>
  );
}
