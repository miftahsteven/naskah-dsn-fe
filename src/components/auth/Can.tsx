"use client";

import React from "react";
import { useAuthStore } from "@/stores/auth.store";

interface CanProps {
  perform: string | string[];
  all?: boolean; // If true, all permissions must be present. If false, any.
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ 
  perform, 
  all = false, 
  children, 
  fallback = null 
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

    // Admin bypass removed to allow strict enforcement

  const userPermissions = user.permissions || [];
  const permissionsToCheck = Array.isArray(perform) ? perform : [perform];

  const hasPermission = all
    ? permissionsToCheck.every((p) => userPermissions.includes(p))
    : permissionsToCheck.some((p) => userPermissions.includes(p));

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default Can;
