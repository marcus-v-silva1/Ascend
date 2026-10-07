import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  forbidden: "Esta conta não tem acesso a este app.",
  link: "O link expirou ou já foi usado. Peça um novo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold">Glow-Up</h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          Seu plano de estudos, carreira e mudança.
        </p>
        <LoginForm next={next} initialError={error} />
      </div>
    </main>
  );
}
