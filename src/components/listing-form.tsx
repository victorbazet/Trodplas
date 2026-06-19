"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createListing } from "@/app/actions/listings";
import { listingSchema, type ListingInput } from "@/lib/validations";
import { CATEGORIES, SEGMENTS, STORAGE_BUCKET } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ListingForm() {
  const t = useTranslations("listing");
  const tc = useTranslations("categories");
  const ts = useTranslations("segments");

  const STEPS = [t("steps.details"), t("steps.pricing"), t("steps.photos")] as const;

  const [step, setStep] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    setValue,
    watch,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "tools",
      segment: "consumer",
      pricePerDay: 0,
      depositAmount: 0,
      city: "",
      imageUrls: [],
    },
  });

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setServerError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setServerError(t("sessionExpired"));
      setUploading(false);
      return;
    }

    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        setServerError(t("uploadFailed", { error: error.message }));
        continue;
      }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    const next = [...imageUrls, ...urls];
    setImageUrls(next);
    setValue("imageUrls", next);
    setUploading(false);
  }

  function removeImage(url: string) {
    const next = imageUrls.filter((u) => u !== url);
    setImageUrls(next);
    setValue("imageUrls", next);
  }

  async function next() {
    const fields: (keyof ListingInput)[][] = [
      ["title", "description", "category", "segment"],
      ["pricePerDay", "depositAmount", "city"],
      ["imageUrls"],
    ];
    const ok = await trigger(fields[step]);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(values: ListingInput) {
    setServerError(null);
    const res = await createListing(values);
    if (res?.error) setServerError(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Stepper */}
      <ol className="flex gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center transition-colors ${
              i === step
                ? "border-primary bg-primary/5 font-semibold text-primary"
                : i < step
                  ? "border-primary/40 text-primary/80"
                  : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-4">
          <Field label={t("titleLabel")} error={errors.title?.message}>
            <Input {...register("title")} placeholder={t("titlePlaceholder")} />
          </Field>
          <Field label={t("descLabel")} error={errors.description?.message}>
            <Textarea
              {...register("description")}
              rows={5}
              placeholder={t("descPlaceholder")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("categoryLabel")} error={errors.category?.message}>
              <Select
                defaultValue={watch("category")}
                onValueChange={(v) => setValue("category", v as ListingInput["category"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.emoji} {tc(c.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("segmentLabel")} error={errors.segment?.message}>
              <Select
                defaultValue={watch("segment")}
                onValueChange={(v) => setValue("segment", v as ListingInput["segment"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{ts(s.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("pricePerDay")} error={errors.pricePerDay?.message}>
              <Input type="number" step="0.01" min="0" {...register("pricePerDay")} />
            </Field>
            <Field label={t("deposit")} error={errors.depositAmount?.message}>
              <Input type="number" step="0.01" min="0" {...register("depositAmount")} />
            </Field>
          </div>
          <Field label={t("cityLabel")} error={errors.city?.message}>
            <Input {...register("city")} placeholder="Lyon" />
          </Field>
          <p className="text-xs text-muted-foreground">{t("depositNote")}</p>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-4">
          <Label>{t("photosLabel")}</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-muted-foreground hover:bg-accent">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-sm">{t("uploadPhotos")}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
          </label>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {imageUrls.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {t("back")}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            {t("continue")}
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("publish")}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
