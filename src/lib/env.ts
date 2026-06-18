/**
 * Zod-validated environment variables.
 * Fails fast at import — a missing required var crashes the server at startup,
 * not silently at runtime inside a request handler.
 */
import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
});

function parseEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(`❌ Missing / invalid environment variables: ${missing}`);
  }
  return result.data as z.infer<T>;
}

export const clientEnv = parseEnv(clientSchema);

/**
 * Server-only env — only import in server components, route handlers, and server actions.
 * Importing on the client will throw at build time because process.env server vars are stripped.
 */
export const serverEnv = {
  ...clientEnv,
  ...parseEnv(serverSchema),
};
