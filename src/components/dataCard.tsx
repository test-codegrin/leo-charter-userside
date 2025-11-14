// components/DataCard.tsx

interface DataCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export default function DataCard({ title, value, className }: DataCardProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <p className="text-md text-neutral-400 mb-1">{title}</p>
      <p className="text-white text-lg">{value || "-"}</p>
    </div>
  );
}
