"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="ghost" size="sm" className="w-full justify-start">
        <LogOut className="h-4 w-4" />
        Salir
      </Button>
    </form>
  );
}
