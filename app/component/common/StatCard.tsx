interface StatCardProps {
  title: string;
  value: number;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Top Accent */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 to-orange-300" />

      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>

        <h3 className="mt-1 text-4xl font-extrabold text-orange-600 transition-transform duration-300 group-hover:scale-105">
          {value}
        </h3>
      </div>
    </div>
  );
}
