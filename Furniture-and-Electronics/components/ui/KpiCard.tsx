import type { ReactNode } from "react";

export type KpiAccent = "blue" | "green" | "amber" | "violet" | "rose";

export interface KpiCardProps {
  label: string;
  value: string | number;
  note?: string;
  accent?: KpiAccent;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}

const accentStyles: Record<KpiAccent, { icon: string; note: string }> = {
  blue: {
    icon: "bg-blue-50 text-blue-700 ring-blue-100",
    note: "text-slate-500",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    note: "text-emerald-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    note: "text-amber-800",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 ring-violet-100",
    note: "text-slate-500",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    note: "text-rose-700",
  },
};

export default function KpiCard({
  label,
  value,
  note,
  accent = "blue",
  icon,
  className = "",
  valueClassName = "",
}: KpiCardProps) {
  const currentAccent = accentStyles[accent] || accentStyles.blue;

  return (
    <article
      className={`group relative min-h-28 sm:min-h-36 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-[0_2px_8px_rgba(15,23,42,0.045)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] motion-reduce:transform-none motion-reduce:transition-none ${className}`}
    >
      <div className="flex h-full items-start justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] sm:tracking-[0.12em] text-slate-500 leading-tight">
            {label}
          </p>
          <p
            className={`mt-1.5 sm:mt-2.5 whitespace-nowrap text-lg sm:text-[clamp(1.35rem,2vw,1.75rem)] font-bold leading-none tracking-[-0.04em] text-slate-900 ${valueClassName}`}
          >
            {value}
          </p>
          {note && (
            <p className={`mt-1.5 sm:mt-2.5 text-[10px] sm:text-xs font-medium leading-snug ${currentAccent.note}`}>
              {note}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`mt-0.5 flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ring-1 ring-inset ${currentAccent.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}
