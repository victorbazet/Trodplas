import type { ListingCategory, ListingSegment } from "@/types/database";

export const APP_NAME = "Trodplas";
export const APP_TAGLINE = "Louez ce qui prend trop de place.";

export const CATEGORIES: { value: ListingCategory; label: string; emoji: string }[] = [
  { value: "tools", label: "Tools", emoji: "🔧" },
  { value: "garden", label: "Garden", emoji: "🌱" },
  { value: "camping", label: "Camping", emoji: "⛺" },
  { value: "photo", label: "Photo", emoji: "📷" },
  { value: "video", label: "Video", emoji: "🎥" },
  { value: "audio", label: "Audio", emoji: "🎙️" },
  { value: "instruments", label: "Instruments", emoji: "🎸" },
  { value: "other", label: "Other", emoji: "📦" },
];

export const SEGMENTS: { value: ListingSegment; label: string; description: string }[] = [
  { value: "consumer", label: "Everyday", description: "Tools, DIY & camping gear" },
  { value: "pro", label: "Pro / Creative", description: "High-value cameras, audio, instruments" },
];

export const STORAGE_BUCKET = "listing-images";

export function categoryLabel(value: ListingCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
