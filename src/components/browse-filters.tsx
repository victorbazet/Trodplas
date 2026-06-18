"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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

/** Client-side filter bar that writes the chosen filters into the URL query. */
export function BrowseFilters() {
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
    <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          value={params.get("category") ?? ANY}
          onValueChange={(v) => update("category", v)}
        >
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Segment</Label>
        <Select
          value={params.get("segment") ?? ANY}
          onValueChange={(v) => update("segment", v)}
        >
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          defaultValue={params.get("city") ?? ""}
          placeholder="e.g. Lyon"
          onBlur={(e) => update("city", e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") update("city", (e.target as HTMLInputElement).value || null);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="start">From</Label>
        <Input
          id="start"
          type="date"
          defaultValue={params.get("startDate") ?? ""}
          onChange={(e) => update("startDate", e.target.value || null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="end">To</Label>
        <div className="flex gap-2">
          <Input
            id="end"
            type="date"
            defaultValue={params.get("endDate") ?? ""}
            onChange={(e) => update("endDate", e.target.value || null)}
          />
          <Button variant="ghost" onClick={() => router.push("/browse")}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
