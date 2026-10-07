"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_GROUPS, type NavItem } from "./nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/gestao") return pathname === "/gestao";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate, pathname }: { onNavigate?: () => void; pathname: string }) {
  return (
    <nav className="space-y-6" aria-label="Principal">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-xs font-medium text-sidebar-foreground/60">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks onNavigate={onNavigate} pathname={usePathname()} />;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Ícone e texto decididos por CSS (classe .dark no <html>): servidor e cliente geram o mesmo HTML
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60"
    >
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="size-4 dark:hidden" aria-hidden />
      <span className="hidden dark:inline">Tema claro</span>
      <span className="dark:hidden">Tema escuro</span>
    </button>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar px-3 py-5 text-sidebar-foreground">
      <Link href="/dashboard" className="mb-8 px-3 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
        Glow-Up
      </Link>
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<NavLinks pathname="" />}>
          <ActiveNavLinks onNavigate={onNavigate} />
        </Suspense>
      </div>
      <div className="mt-4 space-y-0.5 border-t border-sidebar-border pt-4">
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 lg:block">
      <SidebarBody />
    </aside>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={<MobileNavInner pathname="" />}>
      <ActiveMobileNav />
    </Suspense>
  );
}

function ActiveMobileNav() {
  return <MobileNavInner pathname={usePathname()} />;
}

function MobileNavInner({ pathname }: { pathname: string }) {
  const items: NavItem[] = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.mobile);
  return (
    <nav
      aria-label="Atalhos"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <Sheet>
        <SheetTrigger className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground">
          <Menu className="size-5" aria-hidden />
          Mais
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-none p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
