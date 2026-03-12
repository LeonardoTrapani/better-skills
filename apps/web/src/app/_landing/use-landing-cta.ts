"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

export function useLandingCta() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = mounted && Boolean(session);

  return {
    ctaHref: (isAuthenticated ? "/vault" : "/login") as Route,
    ctaLabel: isAuthenticated ? "Go to Vault" : "Get Started",
  };
}
