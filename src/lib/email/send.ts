import { getResend } from "@/lib/email/resend";
import { serverEnv } from "@/lib/env";
import { clientEnv } from "@/lib/env";

/**
 * Thin transactional-email helpers. These are intentionally simple HTML
 * strings — swap for React Email templates later.
 *
 * Every send is wrapped so a mail failure never breaks the core flow: we log
 * and continue. (Booking confirmation should not 500 because email is down.)
 */
async function safeSend(args: { to: string; subject: string; html: string }) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: serverEnv.resendFromEmail,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
  } catch (err) {
    // TODO: pipe to your logger / error tracker.
    console.error("[email] send failed:", err);
  }
}

const wrap = (body: string) =>
  `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px">
     <h1 style="font-size:20px">Trodplas</h1>${body}
     <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
     <p style="color:#888;font-size:12px">You received this email because you have a Trodplas account.</p>
   </div>`;

export function sendBookingRequestedEmail(to: string, listingTitle: string, bookingId: string) {
  return safeSend({
    to,
    subject: `New booking request — ${listingTitle}`,
    html: wrap(
      `<p>You have a new booking request for <strong>${listingTitle}</strong>.</p>
       <p><a href="${clientEnv.appUrl}/dashboard/bookings/${bookingId}">Review the request →</a></p>`,
    ),
  });
}

export function sendBookingConfirmedEmail(to: string, listingTitle: string, bookingId: string) {
  return safeSend({
    to,
    subject: `Booking confirmed — ${listingTitle}`,
    html: wrap(
      `<p>Your booking for <strong>${listingTitle}</strong> is confirmed and paid.</p>
       <p><a href="${clientEnv.appUrl}/dashboard/bookings/${bookingId}">View booking →</a></p>`,
    ),
  });
}

export function sendBookingDeclinedEmail(to: string, listingTitle: string) {
  return safeSend({
    to,
    subject: `Booking declined — ${listingTitle}`,
    html: wrap(
      `<p>Unfortunately your request for <strong>${listingTitle}</strong> was declined.</p>`,
    ),
  });
}
