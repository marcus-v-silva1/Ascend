import type { SeedPreset, SeedSubject } from "./types";

export const SUBJECTS: SeedSubject[] = [
  // PSM I
  { id: "psm", name: "PSM I (Scrum)", kind: "exam", description: "Professional Scrum Master I — Scrum.org. Base: Scrum Guide 2020." },
  { id: "psm-teoria", name: "Teoria, pilares e valores", kind: "topic", parent: "psm" },
  { id: "psm-time", name: "Scrum Team e responsabilidades", kind: "topic", parent: "psm" },
  { id: "psm-eventos", name: "Eventos", kind: "topic", parent: "psm" },
  { id: "psm-artefatos", name: "Artefatos e compromissos", kind: "topic", parent: "psm" },

  // COBIT 2019
  { id: "cobit", name: "COBIT 2019 Foundation", kind: "exam", description: "ISACA. 75 questões, 2h, 65%." },
  { id: "cobit-principios", name: "Princípios", kind: "topic", parent: "cobit" },
  { id: "cobit-componentes", name: "Componentes do sistema de governança", kind: "topic", parent: "cobit" },
  { id: "cobit-objetivos", name: "Objetivos de governança e gestão", kind: "topic", parent: "cobit" },
  { id: "cobit-design", name: "Fatores de design e cascata de metas", kind: "topic", parent: "cobit" },
  { id: "cobit-desempenho", name: "Gestão de desempenho", kind: "topic", parent: "cobit" },
  { id: "cobit-implementacao", name: "Implementação", kind: "topic", parent: "cobit" },

  // ITIL 4
  { id: "itil", name: "ITIL 4 Foundation", kind: "exam", description: "PeopleCert. 40 questões, 60 min, 65%." },
  { id: "itil-conceitos", name: "Conceitos-chave de gestão de serviços", kind: "topic", parent: "itil" },
  { id: "itil-principios", name: "Princípios orientadores", kind: "topic", parent: "itil" },
  { id: "itil-dimensoes", name: "Quatro dimensões", kind: "topic", parent: "itil" },
  { id: "itil-svs", name: "Sistema de valor de serviço e cadeia de valor", kind: "topic", parent: "itil" },
  { id: "itil-praticas", name: "Práticas", kind: "topic", parent: "itil" },

  // ISTQB CTFL v4
  { id: "istqb", name: "ISTQB CTFL v4", kind: "exam", description: "Certified Tester Foundation Level. 40 questões, 60 min, 65%." },
  { id: "istqb-fundamentos", name: "Fundamentos de teste", kind: "topic", parent: "istqb" },
  { id: "istqb-sdlc", name: "Teste no ciclo de vida", kind: "topic", parent: "istqb" },
  { id: "istqb-estatico", name: "Teste estático", kind: "topic", parent: "istqb" },
  { id: "istqb-tecnicas", name: "Técnicas de teste", kind: "topic", parent: "istqb" },
  { id: "istqb-gestao", name: "Gestão de teste", kind: "topic", parent: "istqb" },

  // Concursos de TI
  { id: "concursos", name: "Concursos de TI", kind: "exam", description: "Base única para Dataprev, TJSC, CIDASC, TRF4, UFSC, MPSC." },
  { id: "conc-engsoft", name: "Engenharia de Software", kind: "discipline", parent: "concursos" },
  { id: "conc-testes", name: "Testes de Software", kind: "discipline", parent: "concursos" },
  { id: "conc-bd", name: "Banco de Dados e SQL", kind: "discipline", parent: "concursos" },
  { id: "conc-redes", name: "Redes de Computadores", kind: "discipline", parent: "concursos" },
  { id: "conc-seguranca", name: "Segurança da Informação", kind: "discipline", parent: "concursos" },
  { id: "conc-devops", name: "DevOps, Cloud e Arquitetura", kind: "discipline", parent: "concursos" },
  { id: "conc-governanca", name: "Governança e Gestão de TI", kind: "discipline", parent: "concursos" },
  { id: "conc-ageis", name: "Metodologias Ágeis e Projetos", kind: "discipline", parent: "concursos" },
  { id: "conc-lgpd", name: "LGPD", kind: "discipline", parent: "concursos" },
  { id: "conc-portugues", name: "Língua Portuguesa", kind: "discipline", parent: "concursos" },
  { id: "conc-ingles", name: "Língua Inglesa", kind: "discipline", parent: "concursos" },
  { id: "conc-atualidades", name: "Atualidades e IA", kind: "discipline", parent: "concursos" },
  { id: "conc-constitucional", name: "Direito Constitucional", kind: "discipline", parent: "concursos" },
  { id: "conc-administrativo", name: "Direito Administrativo", kind: "discipline", parent: "concursos" },
  { id: "conc-rlm", name: "Raciocínio Lógico", kind: "discipline", parent: "concursos" },
  { id: "conc-admpublica", name: "Administração Pública", kind: "discipline", parent: "concursos" },

  // Inglês
  { id: "ingles", name: "Inglês", kind: "exam", description: "Vocabulário e frases para trabalho e entrevistas." },
];

export const PRESETS: SeedPreset[] = [
  { id: "p-psm", name: "Simulado PSM I", subject: "psm", question_count: 80, duration_min: 60, pass_pct: 85, ready_pct: 95, official_url: "https://www.scrum.org/assessments/professional-scrum-master-i-certification" },
  { id: "p-psm-mini", name: "Mini PSM (20 questões)", subject: "psm", question_count: 20, duration_min: 15, pass_pct: 85, ready_pct: 95 },
  { id: "p-cobit", name: "Simulado COBIT 2019 Foundation", subject: "cobit", question_count: 75, duration_min: 120, pass_pct: 65, ready_pct: 80, official_url: "https://www.isaca.org/credentialing/cobit/cobit-foundation" },
  { id: "p-itil", name: "Simulado ITIL 4 Foundation", subject: "itil", question_count: 40, duration_min: 60, pass_pct: 65, ready_pct: 80, official_url: "https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-4-foundation-2565" },
  { id: "p-istqb", name: "Simulado ISTQB CTFL", subject: "istqb", question_count: 40, duration_min: 60, pass_pct: 65, ready_pct: 80, official_url: "https://bstqb.online/" },
  { id: "p-concursos", name: "Simulado misto de concurso", subject: "concursos", question_count: 50, duration_min: 150, pass_pct: 70, ready_pct: 80 },
];
