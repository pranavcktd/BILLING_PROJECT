import { Search } from "lucide-react";

export function GlobalSearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/search" method="GET" className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search invoices, clients, quotations…"
        className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </form>
  );
}
