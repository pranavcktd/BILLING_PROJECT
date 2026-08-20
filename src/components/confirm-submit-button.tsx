"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  variant = "destructive",
  size,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  variant?: "destructive" | "outline" | "secondary" | "default" | "ghost";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
