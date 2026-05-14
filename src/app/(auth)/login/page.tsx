import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-coral text-2xl font-black text-white shadow-glow">
            s
          </div>
          <div>
            <p className="text-xs font-black uppercase text-primary">sCode Digital Solutions</p>
            <h1 className="text-2xl font-black text-white">Finance OS</h1>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardDescription>Acceso seguro</CardDescription>
              <CardTitle>Ingresar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
