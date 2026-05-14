"use client";

import { useActionState } from "react";
import { Lock, UserRound } from "lucide-react";
import { loginAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="grid gap-4">
      <Label>
        Usuario
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" name="credential" type="text" autoComplete="username" placeholder="FranPernil o MaxiTaxi" required />
        </div>
      </Label>
      <Label>
        Contrasena
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" name="password" type="password" autoComplete="current-password" required minLength={8} />
        </div>
      </Label>
      {state?.ok === false ? <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{state.message}</p> : null}
      <Button disabled={pending} className="mt-2">
        {pending ? "Ingresando..." : "Ingresar al dashboard"}
      </Button>
    </form>
  );
}
