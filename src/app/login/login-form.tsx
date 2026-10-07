"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn, type LoginState } from "./actions";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {
    error: initialError,
  });
  const [useLink, setUseLink] = useState(false);

  if (state.sent) {
    return (
      <p className="rounded-md bg-accent p-4 text-sm text-accent-foreground" role="status">
        Link enviado. Abra seu e-mail e clique nele para entrar.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="field-label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      {!useLink && (
        <div>
          <label htmlFor="password" className="field-label">Senha</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
      )}
      {state.error && (
        <p className="text-sm text-destructive" role="alert">{state.error}</p>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Entrando…" : useLink ? "Enviar link de acesso" : "Entrar"}
      </Button>
      <button
        type="button"
        onClick={() => setUseLink((v) => !v)}
        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {useLink ? "Entrar com senha" : "Receber link por e-mail"}
      </button>
    </form>
  );
}
