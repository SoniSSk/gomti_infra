interface StatCardProps {
  title: string;
  value: number;

  // When set, the card renders as a toggle button
  onClick?: () => void;
  active?: boolean;
}

export default function StatCard({
  title,
  value,
  onClick,
  active = false,
}: StatCardProps) {
  const interactive = Boolean(onClick);

  const Wrapper = interactive ? "button" : "div";

  return (
    <Wrapper
      {...(interactive
        ? {
          type: "button" as const,
          onClick,
          "aria-pressed": active,
        }
        : {})}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-white px-3 py-3 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${active
        ? "border-orange-400 ring-2 ring-orange-200"
        : "border-gray-100"
        } ${interactive
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          : ""
        }`}
    >
      {/* Top Accent */}
      <span className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 to-orange-300" />

      <span className="flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
          {title}
        </span>

        <span className="mt-1 block text-3xl font-extrabold sm:text-4xl text-orange-600 transition-transform duration-300 group-hover:scale-105">
          {value}
        </span>
      </span>
    </Wrapper>
  );
}
