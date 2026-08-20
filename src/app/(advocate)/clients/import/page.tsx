import { requireModulePermission } from "@/lib/auth-guard";
import { bulkImportClients } from "@/lib/actions/clients";
import { CsvImportForm } from "@/components/csv-import-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImportClientsPage() {
  await requireModulePermission("clients", "MANAGE");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Clients</h1>
        <p className="text-sm text-muted-foreground">
          Bulk-add clients from a CSV file. Only &quot;name&quot; is required.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvImportForm
            action={bulkImportClients}
            templateHeaders={["name", "email", "phone", "address", "gstin", "tan", "notes"]}
            templateFilename="clients-template.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
}
