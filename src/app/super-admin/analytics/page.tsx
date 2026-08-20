import { requireSuperAdmin } from "@/lib/auth-guard";
import { getPlatformAnalytics } from "@/lib/super-admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarList } from "@/components/charts/bar-list";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default async function SuperAdminAnalyticsPage() {
  await requireSuperAdmin();
  const stats = await getPlatformAnalytics();
  const currency = (v: number) => `₹${v.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide numbers across every organization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <StatTile label="Total" value={String(stats.totalOrganizations)} />
            <StatTile label="Active" value={String(stats.activeOrgs)} />
            <StatTile label="Suspended" value={String(stats.suspendedOrgs)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logins</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Super Admins" value={String(stats.superAdmins)} />
            <StatTile label="Admins" value={String(stats.admins)} />
            <StatTile label="Team Members" value={String(stats.staff)} />
            <StatTile label="Client Portal" value={String(stats.clientLogins)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing Volume</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <StatTile label="Total Clients" value={String(stats.totalClients)} />
            <StatTile label="Total Invoices" value={String(stats.totalInvoices)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Money Flow</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <StatTile label="Total Invoiced" value={currency(stats.totalInvoiceValue)} />
            <StatTile label="Total Collected" value={currency(stats.totalCollected)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organizations Onboarded — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BarList data={stats.organizationsPerMonth} valueFormatter={(v) => String(v)} />
        </CardContent>
      </Card>
    </div>
  );
}
