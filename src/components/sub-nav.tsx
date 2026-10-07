"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

type Props = { links: { href: string; label: string }[]; label: string };

export function SubNav(props: Props) {
  return (
    <Suspense fallback={<SubNavInner {...props} pathname="" />}>
      <ActiveSubNav {...props} />
    </Suspense>
  );
}

function ActiveSubNav(props: Props) {
  return <SubNavInner {...props} pathname={usePathname()} />;
}

function SubNavInner({ links, label, pathname }: Props & { pathname: string }) {
  return (
    <nav aria-label={label} className="-mx-4 mb-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
