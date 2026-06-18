import "server-only";

import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

export const resend = new Resend(serverEnv.RESEND_API_KEY);

/** Plain email address to use in the `from` field of outgoing emails. */
export const emailFrom = `Mentoria Hub <${serverEnv.EMAIL_FROM}>`;
