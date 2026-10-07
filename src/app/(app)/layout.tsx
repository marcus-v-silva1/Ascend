import { Suspense } from "react";
import Link from "next/link";
import { MobileNav, Sidebar } from "@/components/app-nav";
import { AscendLogo } from "@/components/brand";
import { requireUser } from "@/lib/auth";

// Área logada: tudo depende do usuário e do relógio, então a navegação pode esperar os dados
// (o loading.tsx mostra um esqueleto enquanto isso).
export const instant = false;

/** Confere o dono e carrega o conteúdo inicial antes de qualquer página. */
async function Gate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-56 rounded bg-muted" />
      <div className="h-4 w-96 max-w-full rounded bg-muted" />
      <div className="mt-6 h-40 rounded-lg bg-muted" />
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pb-10">
        <header className="-mx-4 -mt-6 mb-6 flex items-center border-b bg-card/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
          <Link href="/dashboard" aria-label="Ascend: ir para Hoje" className="text-foreground">
            <AscendLogo markClassName="size-6" />
          </Link>
        </header>
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<PageSkeleton />}>
            <Gate>{children}</Gate>
          </Suspense>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
