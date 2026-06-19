"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { login, signInWithGoogle, type ActionResult } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";
  const checkEmail = params.get("check_email");
  const [state, formAction] = useActionState<ActionResult, FormData>(login, undefined);

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-foreground no-underline">
        <Package className="h-6 w-6 text-primary" />
        Trodplas
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkEmail && (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              {t("checkEmail")}
            </p>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirect" value={redirect} />
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <SubmitButton className="w-full" pendingText={t("loggingIn")}>
              {t("login")}
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
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              {t("signup")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
