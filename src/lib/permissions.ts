export const MODULES = [
  "clients",
  "quotations",
  "contracts",
  "invoices",
  "payments",
  "services",
  "expenses",
  "reports",
  "settings",
  "clientNotes",
] as const;

export type ModuleName = (typeof MODULES)[number];

export const PERMISSION_LEVELS = ["NONE", "VIEW", "MANAGE"] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export const MODULE_LABELS: Record<ModuleName, string> = {
  clients: "Clients & Matters",
  quotations: "Quotations",
  contracts: "Contracts",
  invoices: "Invoices",
  payments: "Payments",
  services: "Services & Products",
  expenses: "Expenses",
  reports: "Reports",
  settings: "Settings",
  clientNotes: "Client Ledger & Notes",
};

// Route prefixes middleware can gate at page-reachability granularity.
// clientNotes has no route prefix of its own (it lives under /clients/[id]/notes/...)
// — that distinction is enforced only at the action layer, see auth-guard.ts.
export const MODULE_ROUTE_MAP: { prefix: string; module: ModuleName }[] = [
  { prefix: "/clients", module: "clients" },
  { prefix: "/matters", module: "clients" },
  { prefix: "/quotations", module: "quotations" },
  { prefix: "/contracts", module: "contracts" },
  { prefix: "/invoices", module: "invoices" },
  { prefix: "/payments", module: "payments" },
  { prefix: "/services", module: "services" },
  { prefix: "/expenses", module: "expenses" },
  { prefix: "/reports", module: "reports" },
  { prefix: "/settings", module: "settings" },
];

const LEVEL_RANK: Record<PermissionLevel, number> = { NONE: 0, VIEW: 1, MANAGE: 2 };

export function hasPermission(
  permissions: unknown,
  module: ModuleName,
  minLevel: PermissionLevel
): boolean {
  const map = (permissions ?? {}) as Partial<Record<ModuleName, PermissionLevel>>;
  const level = map[module] ?? "NONE";
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevel];
}

export function normalizePermissions(
  raw: Partial<Record<ModuleName, string>>
): Record<ModuleName, PermissionLevel> {
  const result = {} as Record<ModuleName, PermissionLevel>;
  for (const module of MODULES) {
    const value = raw[module];
    result[module] = PERMISSION_LEVELS.includes(value as PermissionLevel)
      ? (value as PermissionLevel)
      : "NONE";
  }
  return result;
}
