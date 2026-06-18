"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendMessage } from "@/app/actions/messages";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageThreadProps {
  bookingId: string;
  messages: Message[];
  currentUserId: string;
}

export function MessageThread({ bookingId, messages, currentUserId }: MessageThreadProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setSending(true);
    const res = await sendMessage(formData);
    setSending(false);
    if (res.error) setError(res.error);
    else {
      formRef.current?.reset();
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Say hello to coordinate pickup.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form ref={formRef} action={onSubmit} className="flex items-end gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <Textarea name="content" rows={1} placeholder="Write a message…" className="min-h-[44px]" required />
        <Button type="submit" size="icon" disabled={sending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
