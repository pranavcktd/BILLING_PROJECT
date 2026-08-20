import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import {
  inviteTeamMember,
  updateTeamMemberPermissions,
  setTeamMemberActive,
  deleteTeamMember,
  resetTeamMemberPassword,
} from "@/lib/actions/team";
import { MODULES, MODULE_LABELS, normalizePermissions, type ModuleName } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function TeamPage() {
  const session = await requireAdvocate();

  const team = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId!, role: "STAFF" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Invite additional logins for your firm and control what each one can see and do,
          module by module.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteTeamMember} className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Login Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit">Invite</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            New logins start with no module access and the default password
            (Client@123) — they must change it on first sign-in. Grant module
            access below.
          </p>
        </CardContent>
      </Card>

      {team.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        team.map((member) => {
          const permissions = normalizePermissions(
            (member.permissions ?? {}) as Partial<Record<ModuleName, string>>
          );
          const updatePermissions = updateTeamMemberPermissions.bind(null, member.id);
          return (
            <Card key={member.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <Badge variant={member.isActive ? "default" : "destructive"}>
                  {member.isActive ? "Active" : "Deactivated"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={updatePermissions} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {MODULES.map((module) => (
                      <div key={module} className="space-y-1">
                        <Label htmlFor={`${member.id}-${module}`} className="text-xs">
                          {MODULE_LABELS[module]}
                        </Label>
                        <Select name={module} defaultValue={permissions[module]}>
                          <SelectTrigger id={`${member.id}-${module}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">No Access</SelectItem>
                            <SelectItem value="VIEW">View</SelectItem>
                            <SelectItem value="MANAGE">Manage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <Button type="submit" size="sm">
                    Save Permissions
                  </Button>
                </form>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <form action={resetTeamMemberPassword.bind(null, member.id)}>
                    <ConfirmSubmitButton
                      variant="outline"
                      size="sm"
                      confirmMessage={`Reset ${member.email}'s password back to the default (Client@123)? They'll be required to change it on next login.`}
                    >
                      Reset Password
                    </ConfirmSubmitButton>
                  </form>
                  {member.isActive ? (
                    <form action={setTeamMemberActive.bind(null, member.id, false)}>
                      <ConfirmSubmitButton
                        variant="outline"
                        size="sm"
                        confirmMessage={`Deactivate ${member.email}? They will not be able to log in until reactivated.`}
                      >
                        Deactivate
                      </ConfirmSubmitButton>
                    </form>
                  ) : (
                    <form action={setTeamMemberActive.bind(null, member.id, true)}>
                      <ConfirmSubmitButton variant="outline" size="sm" confirmMessage={`Reactivate ${member.email}?`}>
                        Reactivate
                      </ConfirmSubmitButton>
                    </form>
                  )}
                  <form action={deleteTeamMember.bind(null, member.id)}>
                    <ConfirmSubmitButton
                      size="sm"
                      confirmMessage={`Remove ${member.email} from your team? This cannot be undone.`}
                    >
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
