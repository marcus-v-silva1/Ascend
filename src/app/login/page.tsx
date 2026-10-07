import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  forbidden: "Esta conta não tem acesso a este app.",
  link: "O link expirou ou já foi usado. Peça um novo.",
};

async function LoginFormWithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  return <LoginForm next={next} initialError={error} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold">Glow-Up</h1>
        <p className="mt-1 mb-8 text-muted-foreground">Seu plano de estudos, carreira e mudança.</p>
        <Suspense fallback={<LoginForm />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
