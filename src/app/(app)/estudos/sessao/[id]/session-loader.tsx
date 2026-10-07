"use client";

import dynamic from "next/dynamic";

// Só no cliente: o simulado restaura respostas do localStorage e usa o relógio local.
export const SessionLoader = dynamic(() => import("./session-runner").then((m) => m.SessionRunner), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-muted-foreground">Carregando questões…</p>,
});
