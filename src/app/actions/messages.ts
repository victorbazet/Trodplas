"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations";

type Result = { error?: string };

/** Send a message in a booking thread. RLS ensures the sender is a participant. */
export async function sendMessage(formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const parsed = messageSchema.safeParse({
    bookingId: formData.get("bookingId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid message" };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    booking_id: parsed.data.bookingId,
    sender_id: user.id,
    content: parsed.data.content,
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`);
  return {};
}
