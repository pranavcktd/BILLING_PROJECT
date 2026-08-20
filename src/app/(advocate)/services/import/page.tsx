import { requireModulePermission } from "@/lib/auth-guard";
import { bulkImportServices } from "@/lib/actions/services";
import { CsvImportForm } from "@/components/csv-import-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImportServicesPage() {
  await requireModulePermission("services", "MANAGE");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Services &amp; Products</h1>
        <p className="text-sm text-muted-foreground">
          Bulk-add services or products from a CSV file. &quot;name&quot; and &quot;rate&quot; are required.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvImportForm
            action={bulkImportServices}
            templateHeaders={["name", "description", "rate", "unit"]}
            templateFilename="services-template.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
}
