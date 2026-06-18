import { z } from "zod";

const CATEGORY = [
  "tools",
  "garden",
  "camping",
  "photo",
  "video",
  "audio",
  "instruments",
  "other",
] as const;

const SEGMENT = ["consumer", "pro"] as const;

// ISO date (YYYY-MM-DD) string.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// ---- Auth --------------------------------------------------------------------
export const signUpSchema = z.object({
  fullName: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Profile -----------------------------------------------------------------
export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  bio: z.string().max(500).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ---- Listing -----------------------------------------------------------------
// Prices are entered by users in EUROS (decimals), stored as cents.
export const listingSchema = z.object({
  title: z.string().min(4, "Give your item a clear title").max(120),
  description: z.string().max(4000).default(""),
  category: z.enum(CATEGORY),
  segment: z.enum(SEGMENT),
  pricePerDay: z.coerce.number().min(0, "Price can't be negative"),
  depositAmount: z.coerce.number().min(0).default(0),
  city: z.string().max(120).optional().or(z.literal("")),
  // Image URLs already uploaded to Supabase Storage.
  imageUrls: z.array(z.string().url()).default([]),
});
export type ListingInput = z.infer<typeof listingSchema>;

// ---- Booking request ---------------------------------------------------------
export const bookingRequestSchema = z
  .object({
    listingId: z.string().uuid(),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

// ---- Message -----------------------------------------------------------------
export const messageSchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().min(1, "Message can't be empty").max(2000),
});
export type MessageInput = z.infer<typeof messageSchema>;

// ---- Review ------------------------------------------------------------------
export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
