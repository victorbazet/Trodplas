"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function SettingsForm({
  defaultFullName,
  defaultBio,
  email,
}: {
  defaultFullName: string;
  defaultBio: string;
  email: string;
}) {
  const [state, formAction] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={defaultFullName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={defaultBio} rows={4} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">Saved.</p>}
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
