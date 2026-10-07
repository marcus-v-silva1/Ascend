import { MobileNav, Sidebar } from "@/components/app-nav";
import { requireUser } from "@/lib/auth";
import { ensureContent } from "@/lib/content/bootstrap";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, userId } = await requireUser();
  await ensureContent(supabase, userId);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pb-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
