"use client";

import React from "react";

interface ActionTooltipProps {
  label: string;
  align?: "center" | "right";
}

/**
 * Premium floating tooltip shown on parent `.group` hover without shifting layout.
 */
export default function ActionTooltip({
  label,
  align = "center",
}: ActionTooltipProps) {
  const positionClass =
    align === "right"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  const arrowClass =
    align === "right"
      ? "right-2.5"
      : "left-1/2 -translate-x-1/2";

  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute bottom-full mb-2 ${positionClass} z-50 whitespace-nowrap rounded-lg bg-[#1C1A17]/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#FAF7F2] border border-white/15 shadow-[0_6px_18px_rgba(28,26,23,0.28)] opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 ease-out`}
    >
      {label}
      <span
        className={`absolute -bottom-1 ${arrowClass} h-2 w-2 rotate-45 bg-[#1C1A17] border-r border-b border-white/15`}
      />
    </span>
  );
}
