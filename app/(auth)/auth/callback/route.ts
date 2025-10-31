import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    logger.error("OAuth callback error", { error, errorDescription });
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-up?error=${encodeURIComponent(
        errorDescription || "Authentication failed",
      )}`,
    );
  }

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        logger.error("Session exchange error", { exchangeError });
        return NextResponse.redirect(
          `${requestUrl.origin}/sign-up?error=${encodeURIComponent(
            "Failed to complete authentication",
          )}`,
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Google User",
            first_name: user.user_metadata?.given_name || "",
            last_name: user.user_metadata?.family_name || "",
            chapter: null,
            role: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (profileError) {
            logger.error("Profile creation error", { profileError, userId: user.id });
          }
        }

        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
      }
    } catch (callbackError) {
      logger.error("OAuth callback processing failure", { callbackError });
      return NextResponse.redirect(
        `${requestUrl.origin}/sign-up?error=${encodeURIComponent(
          "Authentication processing failed",
        )}`,
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/sign-up`);
}