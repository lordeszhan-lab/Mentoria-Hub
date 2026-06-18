"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { Google } from "@lobehub/icons";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { signInWithMagicLink, signInWithGoogle } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ActionState = { error?: string } | undefined;

const initialState: ActionState = undefined;

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await signInWithMagicLink(prev, formData);
      if (!result.error) setSent(true);
      return result;
    },
    initialState,
  );

  useEffect(() => {
    searchParams.then(({ error }) => {
      if (error) toast.error(decodeURIComponent(error));
    });
  }, [searchParams]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (sent) toast.success(t("magicLinkSent"));
  }, [sent, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-canvas] px-4">
      <div
        className="w-full max-w-sm rounded-2xl bg-[--color-surface] p-8"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/mentoria-logo.png"
            alt="Mentoria Hub"
            width={48}
            height={48}
            priority
            className="size-12 object-contain"
          />
        </div>

        <h1 className="text-center text-2xl font-extrabold text-[--color-fg] mb-1">
          {t("welcomeBack")}
        </h1>
        <p className="text-center text-sm text-[--color-fg-muted] mb-8">
          {t("signInToContinue")}
        </p>

        {sent ? (
          <div className="rounded-2xl bg-[--color-brand-soft] border border-[--color-brand-ring] p-5 text-center">
            <p className="font-semibold text-[--color-brand]">
              {t("magicLinkSent")}
            </p>
          </div>
        ) : (
          <>
            {/* Magic link form */}
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">
                  {t("emailAddress")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  className="rounded-full h-11 px-4 border-[--color-border] bg-[--color-surface-2] focus-visible:ring-[--color-brand]"
                />
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-full bg-brand text-white font-semibold shadow-sm transition-colors hover:bg-brand-strong disabled:opacity-60"
              >
                {pending ? "…" : t("sendMagicLink")}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <Separator className="flex-1 bg-[--color-border]" />
              <span className="text-xs text-[--color-fg-faint] font-medium">
                {t("or")}
              </span>
              <Separator className="flex-1 bg-[--color-border]" />
            </div>

            {/* Google */}
            <form action={signInWithGoogle}>
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 rounded-full border-[--color-border] font-semibold text-[--color-fg] hover:bg-[--color-surface-2] flex items-center gap-2.5"
              >
                <Google.Color size={18} />
                <span aria-label="Google">
                  <span style={{ color: "#4285F4" }}>G</span>
                  <span style={{ color: "#EA4335" }}>o</span>
                  <span style={{ color: "#FBBC05" }}>o</span>
                  <span style={{ color: "#4285F4" }}>g</span>
                  <span style={{ color: "#34A853" }}>l</span>
                  <span style={{ color: "#EA4335" }}>e</span>
                </span>
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-[--color-fg-faint]">
          {t("agreeTerms")}
        </p>
      </div>
    </div>
  );
}
