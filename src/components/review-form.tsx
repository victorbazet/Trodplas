"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { leaveReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReviewForm({ bookingId, revieweeName }: { bookingId: string; revieweeName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    formData.set("rating", String(rating));
    const res = await leaveReview(formData);
    setSubmitting(false);
    if (res.error) setError(res.error);
    else {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return <p className="text-sm text-emerald-700">Thanks — your review was submitted.</p>;
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div>
        <Label className="mb-1 block">Rate {revieweeName}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star`}
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <Textarea name="comment" rows={3} placeholder="How did it go? (optional)" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
