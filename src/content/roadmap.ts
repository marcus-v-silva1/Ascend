// Roadmaps no estilo roadmap.sh. Cada nó pode puxar o progresso de outra parte do app
// (link) ou ser marcado à mão (status). Etapas sem link somam o progresso dos filhos.

export type RoadmapLink =
  | { type: "subject"; ref: string }
  | { type: "goal"; ref: string }
  | { type: "key_result"; ref: string }
  | { type: "milestone"; ref: string }
  | { type: "english_unit"; ref: string }
  | { type: "fund"; ref: string };

export type SeedRoadmapNode = {
  id: string;
  roadmap: "europa" | "concursos";
  parent?: string;
  kind: "goal" | "stage" | "topic";
  title: string;
  description?: string;
  side?: "left" | "right";
  status?: "todo" | "doing" | "done" | "skipped";
  link?: RoadmapLink;
  requires?: string[];
  resources?: { title: string; url: string }[];
  href?: string;
};

export const ROADMAPS = [
  {
    id: "europa",
    title: "Rumo à Europa como QA Engineer",
    description: "Cada etapa deixa você mais contratável fora do Brasil. O fim da linha é uma oferta com visto patrocinado.",
  },
  {
    id: "concursos",
    title: "Plano B: concurso de TI em SC",
    description: "Base única de TI e de concurso para Dataprev, TJSC, CIDASC, TRF4, UFSC e MPSC.",
  },
] as const;

const stage = (n: Omit<SeedRoadmapNode, "kind">): SeedRoadmapNode => ({ ...n, kind: "stage" });
const topic = (n: Omit<SeedRoadmapNode, "kind">): SeedRoadmapNode => ({ ...n, kind: "topic" });

export const ROADMAP_NODES: SeedRoadmapNode[] = [
  // ------------------------------------------------------------------ Europa
  stage({ id: "eu-base", roadmap: "europa", title: "Base de QA", description: "O que você já faz como QA Leader. É o alicerce do seu posicionamento: dev + QA + liderança." }),
  topic({ id: "eu-base-tipos", roadmap: "europa", parent: "eu-base", side: "left", title: "Tipos e níveis de teste", status: "done" }),
  topic({ id: "eu-base-tecnicas", roadmap: "europa", parent: "eu-base", side: "right", title: "Técnicas de teste", description: "Partição de equivalência, valor limite, tabela de decisão, transição de estados.", link: { type: "subject", ref: "istqb-tecnicas" }, href: "/estudos" }),
  topic({ id: "eu-base-jira", roadmap: "europa", parent: "eu-base", side: "left", title: "Gestão de defeitos com Jira/Xray", status: "done" }),
  topic({ id: "eu-base-lideranca", roadmap: "europa", parent: "eu-base", side: "right", title: "Estratégia de teste e liderança", status: "done" }),

  stage({ id: "eu-agil", roadmap: "europa", title: "Agilidade", requires: ["eu-base"], description: "Times europeus trabalham com Scrum/Kanban. A PSM I comprova isso no currículo." }),
  topic({ id: "eu-agil-scrum", roadmap: "europa", parent: "eu-agil", side: "left", title: "Scrum Guide 2020", link: { type: "subject", ref: "psm" }, href: "/estudos", resources: [{ title: "Scrum Guide 2020", url: "https://scrumguides.org/scrum-guide.html" }] }),
  topic({ id: "eu-agil-psm", roadmap: "europa", parent: "eu-agil", side: "right", title: "Certificação PSM I", requires: ["eu-agil-scrum"], link: { type: "goal", ref: "g-psm" }, href: "/carreira", resources: [{ title: "Scrum Open (simulado oficial)", url: "https://www.scrum.org/open-assessments/scrum-open" }] }),
  topic({ id: "eu-agil-kanban", roadmap: "europa", parent: "eu-agil", side: "left", title: "Kanban e métricas de fluxo", description: "WIP, lead time, cycle time, throughput." }),

  stage({ id: "eu-gov", roadmap: "europa", title: "Governança de TI", requires: ["eu-agil"], description: "Exigência do seu cargo atual e diferencial para QA Lead em empresas reguladas (bancos, fintechs)." }),
  topic({ id: "eu-gov-cobit", roadmap: "europa", parent: "eu-gov", side: "left", title: "COBIT 2019 Foundation", link: { type: "goal", ref: "g-cobit" }, href: "/carreira" }),
  topic({ id: "eu-gov-itil", roadmap: "europa", parent: "eu-gov", side: "right", title: "ITIL Foundation", link: { type: "goal", ref: "g-itil" }, href: "/carreira" }),

  stage({ id: "eu-auto", roadmap: "europa", title: "Automação de testes", requires: ["eu-base"], description: "O que mais pesa numa vaga de QA Engineer/SDET na Europa." }),
  topic({ id: "eu-auto-ts", roadmap: "europa", parent: "eu-auto", side: "left", title: "TypeScript para QA", resources: [{ title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }] }),
  topic({ id: "eu-auto-pw", roadmap: "europa", parent: "eu-auto", side: "right", title: "Playwright E2E", requires: ["eu-auto-ts"], resources: [{ title: "Documentação do Playwright", url: "https://playwright.dev/docs/intro" }] }),
  topic({ id: "eu-auto-api", roadmap: "europa", parent: "eu-auto", side: "left", title: "Testes de API automatizados", description: "REST, testes de contrato, autenticação, dados de teste.", resources: [{ title: "Playwright: API testing", url: "https://playwright.dev/docs/api-testing" }] }),
  topic({ id: "eu-auto-arq", roadmap: "europa", parent: "eu-auto", side: "right", title: "Arquitetura de testes", description: "Page Objects, fixtures, dados isolados, testes estáveis.", requires: ["eu-auto-pw"] }),

  stage({ id: "eu-devops", roadmap: "europa", title: "CI/CD e DevOps", requires: ["eu-auto"], description: "Testes que rodam sozinhos a cada mudança." }),
  topic({ id: "eu-devops-gha", roadmap: "europa", parent: "eu-devops", side: "left", title: "GitHub Actions", link: { type: "key_result", ref: "kr-eu-ci" }, resources: [{ title: "Documentação do GitHub Actions", url: "https://docs.github.com/actions" }] }),
  topic({ id: "eu-devops-docker", roadmap: "europa", parent: "eu-devops", side: "right", title: "Docker básico", resources: [{ title: "Docker: Get started", url: "https://docs.docker.com/get-started/" }] }),
  topic({ id: "eu-devops-sec", roadmap: "europa", parent: "eu-devops", side: "left", title: "Segurança para QA (OWASP Top 10)", resources: [{ title: "OWASP Top 10", url: "https://owasp.org/Top10/" }] }),

  stage({ id: "eu-istqb", roadmap: "europa", title: "ISTQB CTFL", requires: ["eu-base"], description: "Certificação reconhecida no mundo todo para QA." }),
  topic({ id: "eu-istqb-syllabus", roadmap: "europa", parent: "eu-istqb", side: "left", title: "Syllabus CTFL v4", link: { type: "subject", ref: "istqb" }, href: "/estudos", resources: [{ title: "BSTQB: syllabus", url: "https://bstqb.online/" }] }),
  topic({ id: "eu-istqb-prova", roadmap: "europa", parent: "eu-istqb", side: "right", title: "Prova CTFL", requires: ["eu-istqb-syllabus"], link: { type: "goal", ref: "g-istqb" }, href: "/carreira" }),

  stage({ id: "eu-en", roadmap: "europa", title: "Inglês B2", description: "O principal gargalo para a Irlanda. Avança em paralelo a tudo." }),
  topic({ id: "eu-en-book2", roadmap: "europa", parent: "eu-en", side: "left", title: "Times Book 2: Activate", link: { type: "english_unit", ref: "book-2" }, href: "/ingles" }),
  topic({ id: "eu-en-book3", roadmap: "europa", parent: "eu-en", side: "right", title: "Times Book 3: Development", requires: ["eu-en-book2"], link: { type: "english_unit", ref: "book-3" }, href: "/ingles" }),
  topic({ id: "eu-en-speaking", roadmap: "europa", parent: "eu-en", side: "left", title: "Conversação", link: { type: "key_result", ref: "kr-en-speaking" }, href: "/ingles" }),
  topic({ id: "eu-en-interview", roadmap: "europa", parent: "eu-en", side: "right", title: "Inglês para entrevistas", link: { type: "key_result", ref: "kr-en-interview" }, href: "/flashcards" }),

  stage({ id: "eu-portfolio", roadmap: "europa", title: "Portfólio", requires: ["eu-auto", "eu-devops"], description: "Prova pública do que você sabe fazer." }),
  topic({ id: "eu-portfolio-proj", roadmap: "europa", parent: "eu-portfolio", side: "left", title: "2–3 projetos públicos", requires: ["eu-auto-pw", "eu-auto-api"], link: { type: "key_result", ref: "kr-eu-proj" }, href: "/carreira" }),
  topic({ id: "eu-portfolio-ascend", roadmap: "europa", parent: "eu-portfolio", side: "right", title: "Ascend como projeto de portfólio", description: "Next.js, Supabase, Playwright e CI: um projeto real, construído e testado por você.", status: "doing" }),

  stage({ id: "eu-perfil", roadmap: "europa", title: "Perfil internacional", requires: ["eu-en"], description: "QA Engineer / Test Automation Engineer com background de desenvolvimento." }),
  topic({ id: "eu-perfil-cv", roadmap: "europa", parent: "eu-perfil", side: "left", title: "Currículo em inglês", link: { type: "key_result", ref: "kr-eu-cv" }, href: "/carreira" }),
  topic({ id: "eu-perfil-linkedin", roadmap: "europa", parent: "eu-perfil", side: "right", title: "LinkedIn em inglês", link: { type: "key_result", ref: "kr-eu-linkedin" }, href: "/carreira" }),
  topic({ id: "eu-perfil-pitch", roadmap: "europa", parent: "eu-perfil", side: "left", title: "Pitch de 60 segundos", link: { type: "key_result", ref: "kr-eu-pitch" }, href: "/flashcards" }),

  stage({ id: "eu-apply", roadmap: "europa", title: "Candidaturas", requires: ["eu-perfil", "eu-portfolio"], description: "3 candidaturas às terças e quintas." }),
  topic({ id: "eu-apply-ie", roadmap: "europa", parent: "eu-apply", side: "left", title: "Irlanda: Critical Skills", link: { type: "key_result", ref: "kr-eu-apps" }, href: "/carreira/candidaturas", resources: [{ title: "Critical Skills Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/" }] }),
  topic({ id: "eu-apply-de", roadmap: "europa", parent: "eu-apply", side: "right", title: "Alemanha: EU Blue Card", href: "/carreira/alvos", resources: [{ title: "Make it in Germany: Blue Card", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" }] }),
  topic({ id: "eu-apply-interviews", roadmap: "europa", parent: "eu-apply", side: "left", title: "Entrevistas", link: { type: "key_result", ref: "kr-eu-interviews" }, href: "/carreira/candidaturas" }),

  stage({ id: "eu-move", roadmap: "europa", title: "Mudança", requires: ["eu-apply"], description: "Dinheiro e papelada prontos antes da oferta chegar." }),
  topic({ id: "eu-move-fund", roadmap: "europa", parent: "eu-move", side: "left", title: "Reserva de mudança", link: { type: "fund", ref: "f-move" }, href: "/financas" }),
  topic({ id: "eu-move-visa", roadmap: "europa", parent: "eu-move", side: "right", title: "Visto e documentação", description: "Diploma, antecedentes, passaporte, seguro saúde." }),

  { id: "eu-goal", roadmap: "europa", kind: "goal", title: "QA Engineer na Europa", requires: ["eu-move"], description: "Oferta com visto patrocinado e mudança feita.", link: { type: "key_result", ref: "kr-eu-offer" }, href: "/carreira" },

  // ---------------------------------------------------------------- Concursos
  stage({ id: "cc-tec", roadmap: "concursos", title: "Núcleo técnico", description: "Onde você já leva vantagem: experiência real de TI." }),
  ...(
    [
      ["conc-engsoft", "Engenharia de Software"],
      ["conc-testes", "Testes de Software"],
      ["conc-bd", "Banco de Dados e SQL"],
      ["conc-redes", "Redes"],
      ["conc-seguranca", "Segurança da Informação"],
      ["conc-devops", "DevOps e Arquitetura"],
      ["conc-governanca", "Governança de TI"],
      ["conc-ageis", "Ágil e Projetos"],
    ] as const
  ).map(([ref, title], i) => topic({ id: `cc-tec-${ref}`, roadmap: "concursos", parent: "cc-tec", side: i % 2 ? "right" : "left", title, link: { type: "subject", ref }, href: "/estudos" })),

  stage({ id: "cc-geral", roadmap: "concursos", title: "Núcleo de concurso", description: "A parte que exige estudo do zero." }),
  ...(
    [
      ["conc-portugues", "Língua Portuguesa"],
      ["conc-ingles", "Língua Inglesa"],
      ["conc-rlm", "Raciocínio Lógico"],
      ["conc-lgpd", "LGPD e legislação de TI"],
      ["conc-constitucional", "Direito Constitucional"],
      ["conc-administrativo", "Direito Administrativo"],
      ["conc-admpublica", "Administração Pública"],
      ["conc-atualidades", "Atualidades e IA"],
    ] as const
  ).map(([ref, title], i) => topic({ id: `cc-geral-${ref}`, roadmap: "concursos", parent: "cc-geral", side: i % 2 ? "right" : "left", title, link: { type: "subject", ref }, href: "/estudos" })),

  stage({ id: "cc-provas", roadmap: "concursos", title: "Provas anteriores", requires: ["cc-tec", "cc-geral"], description: "Treino no formato real da banca, com tempo." }),
  topic({ id: "cc-provas-dataprev", roadmap: "concursos", parent: "cc-provas", side: "left", title: "Dataprev 2024 (FGV)", href: "/estudos" }),
  topic({ id: "cc-provas-ufsc", roadmap: "concursos", parent: "cc-provas", side: "right", title: "UFSC 2026 (Coperve)", href: "/estudos" }),

  stage({ id: "cc-datas", roadmap: "concursos", title: "Provas marcadas", requires: ["cc-provas"] }),
  topic({ id: "cc-datas-dataprev", roadmap: "concursos", parent: "cc-datas", side: "left", title: "Dataprev 2026: 11/10", link: { type: "milestone", ref: "m-dataprev-prova" }, href: "/carreira" }),
  topic({ id: "cc-datas-trt8", roadmap: "concursos", parent: "cc-datas", side: "right", title: "TRT-8: 17/01/2027", link: { type: "milestone", ref: "m-trt8" }, href: "/carreira" }),

  { id: "cc-goal", roadmap: "concursos", kind: "goal", title: "Aprovado em concurso de TI em SC", requires: ["cc-datas"], href: "/carreira/alvos" },
];
