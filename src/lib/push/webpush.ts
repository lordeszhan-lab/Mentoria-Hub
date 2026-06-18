import "server-only";

import webpush from "web-push";
import { serverEnv } from "@/lib/env";

webpush.setVapidDetails(
  `mailto:${serverEnv.EMAIL_FROM}`,
  serverEnv.VAPID_PUBLIC_KEY,
  serverEnv.VAPID_PRIVATE_KEY,
);

export { webpush };
