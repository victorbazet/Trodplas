import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

/** SERVER-ONLY Resend client. Lazily constructed so a missing key only throws on send. */
let client: Resend | null = null;

export function getResend() {
  if (!client) {
    client = new Resend(serverEnv.resendApiKey);
  }
  return client;
}
