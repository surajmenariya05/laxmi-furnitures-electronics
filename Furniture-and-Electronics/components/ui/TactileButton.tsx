import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export type TactileVariant =
  | "invoice"       // Ocean Teal -> Champagne Gold (POS / Invoices)
  | "booking"       // Royal Saffron -> Marigold (Weddings / Advance Bookings)
  | "celebrate"     // Imperial Violet -> Sunset Magenta (New Advance Booking)
  | "delivery"      // Slate Steel -> Ice Mist (Delivery / Transit / Secondary)
  | "purchase"      // Sapphire Navy -> Electric Azure (Procurement & Dues)
  | "inventory"     // Deep Ocean -> Electric Cyan (Product Catalog)
  | "excel"         // Forest Jade -> Fresh Mint (Spreadsheet Export)
  | "staff"         // Royal Indigo -> Soft Iris (Team & Credentials)
  | "whatsapp-connect"    // Deep Emerald -> Luminous Mint
  | "whatsapp-disconnect"; // Ruby Crimson -> Rose Coral

export type TactileSize = "sm" | "md" | "lg";

export interface TactileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TactileVariant;
  size?: TactileSize;
  href?: string;
  icon?: ReactNode;
}

const variantStyles: Record<TactileVariant, { gradient: string; text: string; shadow: string; ring: string }> = {
  invoice: {
    gradient: "bg-gradient-to-r from-[#0d9da4] to-[#fce688]",
    text: "text-slate-900 font-bold",
    shadow:
      "shadow-[0_4px_0_0_rgba(7,93,98,0.72),0_6px_14px_rgba(15,23,42,0.18)] active:shadow-[0_1px_0_0_rgba(7,93,98,0.72),0_3px_8px_rgba(15,23,42,0.16)]",
    ring: "focus-visible:ring-[#0d9da4]",
  },
  booking: {
    gradient: "bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(29,78,216,0.78),0_6px_14px_rgba(29,78,216,0.25)] active:shadow-[0_1px_0_0_rgba(29,78,216,0.78),0_3px_8px_rgba(29,78,216,0.2)]",
    ring: "focus-visible:ring-[#2563EB]",
  },
  celebrate: {
    gradient: "bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(30,64,175,0.78),0_6px_14px_rgba(30,64,175,0.25)] active:shadow-[0_1px_0_0_rgba(30,64,175,0.78),0_3px_8px_rgba(30,64,175,0.2)]",
    ring: "focus-visible:ring-[#2563EB]",
  },
  delivery: {
    gradient: "bg-gradient-to-r from-[#475569] to-[#94A3B8]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(30,41,59,0.72),0_6px_14px_rgba(30,41,59,0.2)] active:shadow-[0_1px_0_0_rgba(30,41,59,0.72),0_3px_8px_rgba(30,41,59,0.15)]",
    ring: "focus-visible:ring-[#475569]",
  },
  purchase: {
    gradient: "bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(30,64,175,0.78),0_6px_14px_rgba(30,64,175,0.25)] active:shadow-[0_1px_0_0_rgba(30,64,175,0.78),0_3px_8px_rgba(30,64,175,0.2)]",
    ring: "focus-visible:ring-[#1E40AF]",
  },
  inventory: {
    gradient: "bg-gradient-to-r from-[#0284C7] to-[#06B6D4]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(3,105,161,0.78),0_6px_14px_rgba(3,105,161,0.25)] active:shadow-[0_1px_0_0_rgba(3,105,161,0.78),0_3px_8px_rgba(3,105,161,0.2)]",
    ring: "focus-visible:ring-[#0284C7]",
  },
  excel: {
    gradient: "bg-gradient-to-r from-[#15803D] to-[#22C55E]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(21,128,61,0.78),0_6px_14px_rgba(21,128,61,0.25)] active:shadow-[0_1px_0_0_rgba(21,128,61,0.78),0_3px_8px_rgba(21,128,61,0.2)]",
    ring: "focus-visible:ring-[#15803D]",
  },
  staff: {
    gradient: "bg-gradient-to-r from-[#4338CA] to-[#6366F1]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(67,56,202,0.78),0_6px_14px_rgba(67,56,202,0.25)] active:shadow-[0_1px_0_0_rgba(67,56,202,0.78),0_3px_8px_rgba(67,56,202,0.2)]",
    ring: "focus-visible:ring-[#4338CA]",
  },
  "whatsapp-connect": {
    gradient: "bg-gradient-to-r from-[#15803D] to-[#22C55E]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(21,128,61,0.78),0_6px_14px_rgba(21,128,61,0.25)] active:shadow-[0_1px_0_0_rgba(21,128,61,0.78),0_3px_8px_rgba(21,128,61,0.2)]",
    ring: "focus-visible:ring-[#15803D]",
  },
  "whatsapp-disconnect": {
    gradient: "bg-gradient-to-r from-[#991B1B] to-[#EF4444]",
    text: "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
    shadow:
      "shadow-[0_4px_0_0_rgba(153,27,27,0.78),0_6px_14px_rgba(153,27,27,0.25)] active:shadow-[0_1px_0_0_rgba(153,27,27,0.78),0_3px_8px_rgba(153,27,27,0.2)]",
    ring: "focus-visible:ring-[#991B1B]",
  },
};

const sizeStyles: Record<TactileSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export default function TactileButton({
  children,
  className = "",
  type = "button",
  disabled = false,
  variant = "invoice",
  size = "md",
  href,
  icon,
  ...buttonProps
}: TactileButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const classes = [
    "inline-flex select-none items-center justify-center rounded-lg cursor-pointer tracking-wide",
    v.gradient,
    v.text,
    v.shadow,
    v.ring,
    s,
    "transition-[transform,box-shadow,filter] duration-150 ease-out",
    "hover:brightness-105",
    "active:translate-y-[2px]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button {...buttonProps} type={type} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
