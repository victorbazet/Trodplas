"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, SEGMENTS } from "@/lib/constants";

const ANY = "any";

export function BrowseFilters() {
  const t = useTranslations("browse");
  const tc = useTranslations("categories");
  const ts = useTranslations("segments");
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === ANY) next.delete(key);
      else next.set(key, value);
      router.push(`/browse?${next.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="surface grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label>{t("category")}</Label>
        <Select
          value={params.get("category") ?? ANY}
          onValueChange={(v) => update("category", v)}
        >
          <SelectTrigger><SelectValue placeholder={t("any")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("any")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.emoji} {tc(c.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t("segment")}</Label>
        <Select
          value={params.get("segment") ?? ANY}
          onValueChange={(v) => update("segment", v)}
        >
          <SelectTrigger><SelectValue placeholder={t("any")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("any")}</SelectItem>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{ts(s.value)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">{t("city")}</Label>
        <Input
          id="city"
          defaultValue={params.get("city") ?? ""}
          placeholder={t("cityPlaceholder")}
          onBlur={(e) => update("city", e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") update("city", (e.target as HTMLInputElement).value || null);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="start">{t("from")}</Label>
        <Input
          id="start"
          type="date"
          defaultValue={params.get("startDate") ?? ""}
          onChange={(e) => update("startDate", e.target.value || null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="end">{t("to")}</Label>
        <div className="flex gap-2">
          <Input
            id="end"
            type="date"
            defaultValue={params.get("endDate") ?? ""}
            onChange={(e) => update("endDate", e.target.value || null)}
          />
          <Button variant="ghost" onClick={() => router.push("/browse")}>
            {t("reset")}
          </Button>
        </div>
      </div>
    </div>
  );
}
