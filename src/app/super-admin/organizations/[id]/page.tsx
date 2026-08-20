import { notFound } from "next/navigation";
import { prisma, prismaUnscoped } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import {
  updateOrganizationDetails,
  updateAdminUser,
  setUserActive,
  deleteUser,
  resetAdminPassword,
  setOrganizationSubscriptionStatus,
} from "@/lib/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

function toDateInputValue(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: { users: { where: { role: "ADVOCATE" } } },
  });
  if (!organization) notFound();

  const admin = organization.users[0];

  // Cross-tenant usage counts — deliberate use of the unscoped client,
  // read-only, gated by requireSuperAdmin() above.
  const [
    clients,
    matters,
    quotations,
    contracts,
    invoices,
    payments,
    bankAccounts,
    serviceItems,
    expenses,
    clientNotes,
  ] = await Promise.all([
    prismaUnscoped.client.count({ where: { organizationId: id } }),
    prismaUnscoped.matter.count({ where: { organizationId: id } }),
    prismaUnscoped.quotation.count({ where: { organizationId: id } }),
    prismaUnscoped.contract.count({ where: { organizationId: id } }),
    prismaUnscoped.invoice.count({ where: { organizationId: id } }),
    prismaUnscoped.payment.count({ where: { organizationId: id } }),
    prismaUnscoped.bankAccount.count({ where: { organizationId: id } }),
    prismaUnscoped.serviceItem.count({ where: { organizationId: id } }),
    prismaUnscoped.expense.count({ where: { organizationId: id } }),
    prismaUnscoped.clientNote.count({ where: { organizationId: id } }),
  ]);

  const totalRows =
    clients + matters + quotations + contracts + invoices + payments + bankAccounts + serviceItems + expenses + clientNotes;

  const updateDetails = updateOrganizationDetails.bind(null, organization.id);
  const updateAdmin = admin ? updateAdminUser.bind(null, admin.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">
            Created {organization.createdAt.toLocaleDateString()}
          </p>
        </div>
        <Badge variant={organization.subscriptionStatus === "ACTIVE" ? "default" : "destructive"}>
          {organization.subscriptionStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateDetails} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={organization.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input id="profession" name="profession" defaultValue={organization.profession ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscriptionStartDate">Subscription Start</Label>
                  <Input
                    id="subscriptionStartDate"
                    name="subscriptionStartDate"
                    type="date"
                    defaultValue={toDateInputValue(organization.subscriptionStartDate)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionEndDate">Subscription End</Label>
                  <Input
                    id="subscriptionEndDate"
                    name="subscriptionEndDate"
                    type="date"
                    defaultValue={toDateInputValue(organization.subscriptionEndDate)}
                  />
                </div>
              </div>
              <Button type="submit">Save Organization Details</Button>
            </form>

            <div className="mt-4 border-t pt-4">
              {organization.subscriptionStatus === "ACTIVE" ? (
                <form action={setOrganizationSubscriptionStatus.bind(null, organization.id, "SUSPENDED")}>
                  <ConfirmSubmitButton
                    variant="outline"
                    confirmMessage={`Suspend ${organization.name}? Their admin and clients will not be able to log in until reactivated.`}
                  >
                    Suspend Organization
                  </ConfirmSubmitButton>
                </form>
              ) : (
                <form action={setOrganizationSubscriptionStatus.bind(null, organization.id, "ACTIVE")}>
                  <ConfirmSubmitButton variant="outline" confirmMessage={`Reactivate ${organization.name}?`}>
                    Reactivate Organization
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            {admin && updateAdmin ? (
              <div className="space-y-4">
                <form action={updateAdmin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Name</Label>
                    <Input id="adminName" name="name" defaultValue={admin.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Login Email</Label>
                    <Input id="adminEmail" name="email" type="email" defaultValue={admin.email} required />
                  </div>
                  <Button type="submit">Save Admin Details</Button>
                </form>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <form action={resetAdminPassword.bind(null, admin.id)}>
                    <ConfirmSubmitButton
                      variant="outline"
                      confirmMessage={`Reset ${admin.email}'s password back to the default (Client@123)? They'll be required to change it on next login.`}
                    >
                      Reset Password
                    </ConfirmSubmitButton>
                  </form>
                  {admin.isActive ? (
                    <form action={setUserActive.bind(null, admin.id, false)}>
                      <ConfirmSubmitButton
                        variant="outline"
                        confirmMessage={`Deactivate ${admin.email}? They will not be able to log in until reactivated.`}
                      >
                        Deactivate
                      </ConfirmSubmitButton>
                    </form>
                  ) : (
                    <form action={setUserActive.bind(null, admin.id, true)}>
                      <ConfirmSubmitButton variant="outline" confirmMessage={`Reactivate ${admin.email}?`}>
                        Reactivate
                      </ConfirmSubmitButton>
                    </form>
                  )}
                  <form action={deleteUser.bind(null, admin.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Delete the login for ${admin.email}? This organization will have no admin login until a new one is reset or created. This cannot be undone.`}
                    >
                      Delete Login
                    </ConfirmSubmitButton>
                  </form>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Account status: </span>
                  {admin.isActive ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="destructive">Deactivated</Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No admin login exists for this organization.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
            <div>
              <div className="text-muted-foreground">Clients</div>
              <div className="text-lg font-semibold">{clients}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Matters</div>
              <div className="text-lg font-semibold">{matters}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Quotations</div>
              <div className="text-lg font-semibold">{quotations}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Contracts</div>
              <div className="text-lg font-semibold">{contracts}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Invoices</div>
              <div className="text-lg font-semibold">{invoices}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Payments</div>
              <div className="text-lg font-semibold">{payments}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Bank Accounts</div>
              <div className="text-lg font-semibold">{bankAccounts}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Services</div>
              <div className="text-lg font-semibold">{serviceItems}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Expenses</div>
              <div className="text-lg font-semibold">{expenses}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ledger Notes</div>
              <div className="text-lg font-semibold">{clientNotes}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Total records: <span className="font-medium text-foreground">{totalRows}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
