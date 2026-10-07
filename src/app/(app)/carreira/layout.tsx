import { SubNav } from "@/components/sub-nav";

const LINKS = [
  { href: "/carreira", label: "Metas e marcos" },
  { href: "/carreira/alvos", label: "Concursos e países" },
  { href: "/carreira/candidaturas", label: "Candidaturas" },
];

export default function CareerLayout({ children }: LayoutProps<"/carreira">) {
  return (
    <>
      <SubNav links={LINKS} label="Seções de carreira" />
      {children}
    </>
  );
}
