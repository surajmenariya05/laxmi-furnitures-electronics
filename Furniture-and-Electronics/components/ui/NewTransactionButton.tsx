import type { ButtonHTMLAttributes } from "react";
import TactileButton, { TactileSize } from "./TactileButton";

interface NewTransactionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  size?: TactileSize;
}

export default function NewTransactionButton({
  children = "New Transaction",
  className = "",
  href,
  size = "lg",
  ...buttonProps
}: NewTransactionButtonProps) {
  return (
    <TactileButton
      variant="invoice"
      href={href}
      size={size}
      className={className}
      {...buttonProps}
    >
      {children}
    </TactileButton>
  );
}
