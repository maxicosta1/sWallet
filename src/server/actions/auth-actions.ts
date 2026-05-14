"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function loginAction(_: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      credential: formData.get("credential"),
      password: formData.get("password"),
      redirectTo: "/dashboard"
    });
    return { ok: true, message: "Ingreso correcto" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Usuario o contrasena incorrectos." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
