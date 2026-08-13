"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction =
  | { type: "link"; label: string; href: string }
  | {
      type: "action";
      label: string;
      action: (formData: FormData) => void;
      confirmMessage?: string;
      destructive?: boolean;
      successMessage?: string;
    };

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a, i) =>
          a.type === "link" ? (
            <DropdownMenuItem key={i} render={<Link href={a.href} />}>
              {a.label}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={i}
              variant={a.destructive ? "destructive" : "default"}
              onClick={async () => {
                if (a.confirmMessage && !confirm(a.confirmMessage)) {
                  return;
                }
                try {
                  await a.action(new FormData());
                  toast.success(a.successMessage ?? `${a.label} successful.`);
                } catch (err) {
                  if (isRedirectError(err)) {
                    throw err;
                  }
                  toast.error(
                    err instanceof Error ? err.message : "Something went wrong."
                  );
                }
              }}
            >
              {a.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
