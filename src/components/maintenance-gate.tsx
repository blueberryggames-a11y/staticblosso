"use client";

import React, { ReactNode } from "react";
import { useMaintenanceMode } from "@/lib/site-config";
import { useAuthStore, useAuthHydrated } from "@/store/auth-store";
import { ADMIN_EMAIL } from "@/constants/admin";
import MaintenancePage from "@/components/maintenance-page";

type Props = {
  children: ReactNode;
};

function MaintenanceGate({ children }: Props) {
  const { maintenance, loaded } = useMaintenanceMode();
  const { auth } = useAuthStore();
  const authHydrated = useAuthHydrated();

  // Wait for both the auth store and the maintenance flag before deciding
  // anything, so we never flash the maintenance page at the admin (or the
  // real site at a visitor) before we actually know the state.
  if (!loaded || !authHydrated) {
    return null;
  }

  const isAdmin = auth?.email === ADMIN_EMAIL;

  if (maintenance?.enabled && !isAdmin) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

export default MaintenanceGate;
