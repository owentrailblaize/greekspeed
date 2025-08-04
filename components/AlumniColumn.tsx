import { AlumniCard } from "@/components/AlumniCard";

interface Alumni {
  id: string;
  name: string;
  pledgeYear: string;
  role: string;
  company: string;
  tags: string[];
}

interface Props {
  title: string;
  alumni: Alumni[];
  count: number;
}

export function AlumniColumn({ title, alumni, count }: Props) {
  return (
    <div className="flex-1 min-w-0">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900 font-medium">{title}</h2>
            <span className="bg-navy-600 text-white text-xs px-2 py-1 rounded-full">{count}</span>
          </div>
        </div>
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {alumni.map((p) => (
            <AlumniCard key={p.id} {...p} />
          ))}
        </div>
      </div>
    </div>
  );
} 