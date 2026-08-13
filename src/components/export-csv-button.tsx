import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({ href }: { href: string }) {
  return (
    <Button variant="outline" nativeButton={false} render={<a href={href} />}>
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
