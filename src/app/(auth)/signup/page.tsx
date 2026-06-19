"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { signUp, signInWithGoogle, type ActionResult } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState<ActionResult, FormData>(signUp, undefined);

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-foreground no-underline">
        <Package className="h-6 w-6 text-primary" />
        Trodplas
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("signupTitle")}</CardTitle>
          <CardDescription>{t("signupDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <SubmitButton className="w-full" pendingText={t("creatingAccount")}>
              {t("signup")}
            </SubmitButton>
          </form>

          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">{t("or")}</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 border-t" />
          </div>

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              {t("continueWithGoogle")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("alreadyAccount")}{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              {t("login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
