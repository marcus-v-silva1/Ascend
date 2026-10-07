import {
  BookOpen,
  Compass,
  Languages,
  LayoutDashboard,
  Layers,
  ListChecks,
  NotebookPen,
  Repeat,
  Route,
  UserRound,
  SquareKanban,
  Timer,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; mobile?: boolean };

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Estudar",
    items: [
      { href: "/dashboard", label: "Hoje", icon: LayoutDashboard, mobile: true },
      { href: "/estudos", label: "Questões", icon: ListChecks, mobile: true },
      { href: "/flashcards", label: "Flashcards", icon: Layers, mobile: true },
      { href: "/ingles", label: "Inglês", icon: Languages },
    ],
  },
  {
    label: "Planejar",
    items: [
      { href: "/roadmap", label: "Roadmap", icon: Route, mobile: true },
      { href: "/carreira", label: "Carreira", icon: Compass },
      { href: "/gestao", label: "Tarefas", icon: SquareKanban },
      { href: "/gestao/habitos", label: "Hábitos", icon: Repeat },
      { href: "/gestao/foco", label: "Foco", icon: Timer },
      { href: "/gestao/revisao", label: "Revisão semanal", icon: NotebookPen },
      { href: "/financas", label: "Finanças", icon: Wallet },
    ],
  },
  {
    label: "Método",
    items: [
      { href: "/como-estudar", label: "Como estudar", icon: BookOpen },
      { href: "/perfil", label: "Perfil", icon: UserRound },
    ],
  },
];
