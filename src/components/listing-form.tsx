"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
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

const STEPS = ["Details", "Pricing & location", "Photos"] as const;

export function ListingForm() {
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
      setServerError("Your session expired. Please log in again.");
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
        setServerError(`Upload failed: ${error.message}`);
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
    // On success the action redirects.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Stepper */}
      <ol className="flex gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-md border px-3 py-2 text-center ${
              i === step ? "border-primary font-medium text-primary" : "text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Title" error={errors.title?.message}>
            <Input {...register("title")} placeholder="Bosch professional hammer drill" />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea
              {...register("description")}
              rows={5}
              placeholder="Condition, what's included, pickup details…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <Select
                defaultValue={watch("category")}
                onValueChange={(v) => setValue("category", v as ListingInput["category"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Segment" error={errors.segment?.message}>
              <Select
                defaultValue={watch("segment")}
                onValueChange={(v) => setValue("segment", v as ListingInput["segment"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
            <Field label="Price per day (€)" error={errors.pricePerDay?.message}>
              <Input type="number" step="0.01" min="0" {...register("pricePerDay")} />
            </Field>
            <Field label="Security deposit (€)" error={errors.depositAmount?.message}>
              <Input type="number" step="0.01" min="0" {...register("depositAmount")} />
            </Field>
          </div>
          <Field label="City" error={errors.city?.message}>
            <Input {...register("city")} placeholder="Lyon" />
          </Field>
          <p className="text-xs text-muted-foreground">
            The deposit is held on the renter&apos;s card as an authorization and released
            after a successful return — it is not charged unless there&apos;s a dispute.
          </p>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-4">
          <Label>Photos</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-muted-foreground hover:bg-accent">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-sm">Click to upload images</span>
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
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish listing
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
