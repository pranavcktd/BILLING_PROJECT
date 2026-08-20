import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { updateService } from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePermission("services", "MANAGE");
  const { id } = await params;

  const service = await prisma.serviceItem.findUnique({ where: { id } });
  if (!service) notFound();

  const updateServiceWithId = updateService.bind(null, service.id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Edit Service / Product</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateServiceWithId} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={service.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={service.description ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  defaultValue={service.rate.toFixed(2)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input id="unit" name="unit" defaultValue={service.unit ?? ""} />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
