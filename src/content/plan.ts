// Plano inicial derivado das conversas sobre Europa, certificações e concursos (out/2026).
// Tudo aqui é editável no app; o bootstrap só insere o que ainda não existe.

export const TRACKS = [
  { external_id: "europa", name: "Carreira internacional", description: "Vaga de TI patrocinável na Europa: Irlanda (Critical Skills) → Alemanha (Blue Card) → Holanda/Portugal.", color: "#3b5bdb", icon: "plane", position: 0 },
  { external_id: "certificacoes", name: "Certificações", description: "PSM I → COBIT Foundation → ITIL Foundation, depois ISTQB CTFL.", color: "#8b5cf6", icon: "award", position: 1 },
  { external_id: "concursos", name: "Concursos de TI em SC", description: "Base única de TI + núcleo de concurso para Dataprev, TJSC, CIDASC, TRF4, UFSC e MPSC.", color: "#2f9e6b", icon: "landmark", position: 2 },
  { external_id: "ingles", name: "Inglês B2", description: "Inglês sólido para entrevistas e trabalho na Europa.", color: "#e8a33d", icon: "languages", position: 3 },
];

type KR = { external_id: string; title: string; target_value: number; unit?: string };
type Goal = {
  external_id: string;
  track: string;
  title: string;
  description?: string;
  implementation_intention?: string;
  target_date?: string;
  krs: KR[];
};

export const GOALS: Goal[] = [
  {
    external_id: "g-psm",
    track: "certificacoes",
    title: "Passar no PSM I",
    description: "80 questões, 60 min, 85% para aprovação. US$ 200, não expira. Só comprar o voucher com 95%+ consistente nos simulados.",
    implementation_intention: "Quando terminar o almoço, faço 20 questões de Scrum antes de voltar ao trabalho.",
    target_date: "2026-10-31",
    krs: [
      { external_id: "kr-psm-guide", title: "Ler o Scrum Guide 2020 inteiro", target_value: 2, unit: "leituras" },
      { external_id: "kr-psm-mocks", title: "Simulados PSM I com nota ≥ 95%", target_value: 3, unit: "simulados" },
      { external_id: "kr-psm-exam", title: "Prova realizada e aprovada", target_value: 1 },
    ],
  },
  {
    external_id: "g-cobit",
    track: "certificacoes",
    title: "Passar no COBIT 2019 Foundation",
    description: "75 questões, 2h, 65% para aprovação. US$ 175, prova online. Agendamento a partir de 48h após o pagamento.",
    implementation_intention: "Quando fechar o notebook do trabalho, estudo 1 tópico de COBIT e faço 15 questões.",
    target_date: "2026-11-30",
    krs: [
      { external_id: "kr-cobit-topics", title: "Tópicos do syllabus estudados", target_value: 6, unit: "tópicos" },
      { external_id: "kr-cobit-mocks", title: "Simulados com nota ≥ 80%", target_value: 2, unit: "simulados" },
      { external_id: "kr-cobit-exam", title: "Prova aprovada", target_value: 1 },
    ],
  },
  {
    external_id: "g-itil",
    track: "certificacoes",
    title: "Passar no ITIL Foundation",
    description: "Confirmar com RH/gestão se exigem ITIL 4 ou a nova versão antes de pagar (bundle oficial ~US$ 690).",
    implementation_intention: "Quando confirmar a versão exigida, compro o bundle e reservo 10 dias de estudo.",
    target_date: "2027-01-31",
    krs: [
      { external_id: "kr-itil-version", title: "Versão exigida confirmada com a empresa", target_value: 1 },
      { external_id: "kr-itil-mocks", title: "Simulados com nota ≥ 80%", target_value: 2, unit: "simulados" },
      { external_id: "kr-itil-exam", title: "Prova aprovada", target_value: 1 },
    ],
  },
  {
    external_id: "g-istqb",
    track: "certificacoes",
    title: "ISTQB CTFL",
    description: "Reforça o posicionamento como QA Engineer no mercado europeu.",
    target_date: "2027-04-30",
    krs: [
      { external_id: "kr-istqb-syllabus", title: "Capítulos do syllabus CTFL v4 estudados", target_value: 6, unit: "capítulos" },
      { external_id: "kr-istqb-exam", title: "Prova aprovada", target_value: 1 },
    ],
  },
  {
    external_id: "g-eu-profile",
    track: "europa",
    title: "Perfil internacional pronto",
    description: "Posicionamento: QA Engineer / Test Automation Engineer / QA Lead / SDET, com background de desenvolvimento.",
    implementation_intention: "Todo sábado às 9h, dedico 1h ao currículo, LinkedIn ou portfólio.",
    target_date: "2026-12-15",
    krs: [
      { external_id: "kr-eu-cv", title: "Currículo em inglês revisado", target_value: 1 },
      { external_id: "kr-eu-linkedin", title: "LinkedIn em inglês com headline de QA Engineer", target_value: 1 },
      { external_id: "kr-eu-pitch", title: "Pitch de 60s em inglês gravado", target_value: 1 },
    ],
  },
  {
    external_id: "g-eu-portfolio",
    track: "europa",
    title: "Portfólio de automação no GitHub",
    description: "2–3 projetos realmente apresentáveis: Playwright E2E, testes de API e pipeline de CI/CD. Este app conta como um deles.",
    implementation_intention: "Segunda, quarta e sexta, depois do jantar, 45 min de código no portfólio.",
    target_date: "2027-03-31",
    krs: [
      { external_id: "kr-eu-proj", title: "Projetos publicados com README em inglês", target_value: 3, unit: "projetos" },
      { external_id: "kr-eu-ci", title: "Pipeline GitHub Actions rodando testes", target_value: 1 },
    ],
  },
  {
    external_id: "g-eu-apply",
    track: "europa",
    title: "Conseguir oferta patrocinada na Europa",
    description: "Plano A Irlanda (Critical Skills), B Alemanha (Blue Card — limite 2026 para recém-formados ~€45.934/ano), C Opportunity Card, D Portugal.",
    implementation_intention: "Toda terça e quinta às 20h, envio 3 candidaturas e registro no pipeline.",
    target_date: "2027-09-30",
    krs: [
      { external_id: "kr-eu-apps", title: "Candidaturas enviadas", target_value: 60, unit: "candidaturas" },
      { external_id: "kr-eu-interviews", title: "Entrevistas realizadas", target_value: 5, unit: "entrevistas" },
      { external_id: "kr-eu-offer", title: "Oferta com patrocínio de visto", target_value: 1 },
    ],
  },
  {
    external_id: "g-conc-base",
    track: "concursos",
    title: "Base única de TI para concursos",
    description: "Núcleo técnico + núcleo de concurso para atacar vários editais com a mesma preparação. Piso salarial ~R$ 9–10k.",
    implementation_intention: "Quando acordar, antes do celular, faço 20 questões de uma disciplina do núcleo.",
    target_date: "2027-06-30",
    krs: [
      { external_id: "kr-conc-tech", title: "Disciplinas técnicas revisadas", target_value: 9, unit: "disciplinas" },
      { external_id: "kr-conc-core", title: "Disciplinas de concurso revisadas", target_value: 6, unit: "disciplinas" },
      { external_id: "kr-conc-q", title: "Questões resolvidas", target_value: 3000, unit: "questões" },
    ],
  },
  {
    external_id: "g-en-b2",
    track: "ingles",
    title: "Inglês B2 sólido",
    description: "Principal gargalo para a Irlanda. Estudo diário nas plataformas Times + listening e speaking.",
    implementation_intention: "Quando entrar no carro/ônibus, coloco listening em inglês; às 21h, 30 min de Times.",
    target_date: "2027-10-01",
    krs: [
      { external_id: "kr-en-hours", title: "Horas de estudo de inglês", target_value: 300, unit: "horas" },
      { external_id: "kr-en-speaking", title: "Sessões de conversação", target_value: 50, unit: "sessões" },
      { external_id: "kr-en-interview", title: "Simulações de entrevista em inglês", target_value: 10, unit: "simulações" },
    ],
  },
];

export const MILESTONES = [
  { external_id: "m-itil-version", track: "certificacoes", goal: "g-itil", title: "Confirmar com RH a versão do ITIL exigida", due_date: "2026-10-20" },
  { external_id: "m-psm-voucher", track: "certificacoes", goal: "g-psm", title: "Comprar voucher PSM I (após 3 simulados ≥ 95%)", due_date: "2026-10-25" },
  { external_id: "m-trt8", track: "concursos", title: "TRT-8: prova prevista (Belém)", due_date: "2027-01-17", notes: "Concurso aberto com cargos de TI; bom treino de prova real." },
  { external_id: "m-dataprev-edital", track: "concursos", title: "Acompanhar próximo edital Dataprev (lotação SC)", due_date: "2026-12-31" },
  { external_id: "m-tjsc-edital", track: "concursos", title: "Acompanhar edital TJSC Analista de Sistemas", due_date: "2027-03-31" },
  { external_id: "m-eu-first-apps", track: "europa", goal: "g-eu-apply", title: "Primeiras 10 candidaturas (Irlanda + Alemanha)", due_date: "2027-01-31" },
  { external_id: "m-eu-reserve", track: "europa", title: "Reserva de mudança completa", due_date: "2027-09-30" },
  { external_id: "m-en-inter", track: "ingles", goal: "g-en-b2", title: "Concluir nível intermediário nas plataformas Times", due_date: "2027-03-31" },
];

export const TARGETS = [
  // Concursos: notas da análise (compatibilidade, dificuldade, salário, localização)
  { external_id: "t-dataprev", track: "concursos", kind: "concurso", name: "Dataprev: Analista de TI", location: "Florianópolis/SC", salary_text: "R$ 10.685 + benefícios", salary_value: 10685, compatibility: 9.5, difficulty: 7.5, salary_score: 8.5, location_score: 10, status: "monitorando", notes: "Primeiro alvo. Perfis: análise de negócios, desenvolvimento, sustentação, governança, gestão de serviços." },
  { external_id: "t-tjsc", track: "concursos", kind: "concurso", name: "TJSC: Analista de Sistemas", location: "Florianópolis/SC (sede)", salary_text: "~R$ 10–15k+", salary_value: 12000, compatibility: 9, difficulty: 8, salary_score: 9, location_score: 10, status: "monitorando" },
  { external_id: "t-cidasc", track: "concursos", kind: "concurso", name: "CIDASC: Analista TIC (Sistemas e Negócios)", location: "SC", salary_text: "R$ 10.558+", salary_value: 10558, compatibility: 9.5, difficulty: 7.5, salary_score: 8.5, location_score: 9, status: "monitorando", notes: "Edital cobra governança de TIC, testes, Agile/Scrum/Kanban, PMBOK e ITIL." },
  { external_id: "t-trf4", track: "concursos", kind: "concurso", name: "TRF4: Analista Judiciário (Sistemas)", location: "SC/RS/PR", salary_text: "~R$ 14k+", salary_value: 14000, compatibility: 8.5, difficulty: 9, salary_score: 9, location_score: 9, status: "monitorando", notes: "Último concurso homologado em mar/2026." },
  { external_id: "t-ufsc", track: "concursos", kind: "concurso", name: "UFSC: Analista de TI", location: "Florianópolis/SC", salary_text: "~R$ 5–7k", salary_value: 6000, compatibility: 9, difficulty: 7, salary_score: 6.5, location_score: 10, status: "monitorando", notes: "2026: 82 candidatos/vaga. Abaixo do piso, mas porta de entrada em Floripa." },
  { external_id: "t-mpsc", track: "concursos", kind: "concurso", name: "MPSC: Analista de TI", location: "Florianópolis/SC", salary_text: "~R$ 10k+", salary_value: 10000, compatibility: 8.5, difficulty: 8, salary_score: 8, location_score: 9, status: "monitorando" },
  { external_id: "t-pmf", track: "concursos", kind: "concurso", name: "Prefeitura de Florianópolis: Analista de Sistemas", location: "Florianópolis/SC", salary_text: "variável", compatibility: 9, difficulty: 6, salary_score: 6, location_score: 10, status: "monitorando" },
  { external_id: "t-trt8", track: "concursos", kind: "concurso", name: "TRT-8: Analista Judiciário (TI)", location: "Belém/PA", salary_text: "até R$ 16.040", salary_value: 16040, compatibility: 8.5, difficulty: 8, salary_score: 9, location_score: 3, status: "edital aberto", exam_date: "2027-01-17" },
  { external_id: "t-bc", track: "concursos", kind: "concurso", name: "Banco Central: Analista (TI)", location: "Brasília (há representação em Belém)", salary_text: "R$ 20.000 inicial", salary_value: 20000, compatibility: 8, difficulty: 9.5, salary_score: 10, location_score: 4, status: "monitorando", notes: "Projeto de médio/longo prazo." },
  { external_id: "t-serpro", track: "concursos", kind: "concurso", name: "SERPRO: Analista (Tecnologia)", location: "Nacional", salary_text: "R$ 9.026 + benefícios", salary_value: 9026, compatibility: 9.5, difficulty: 8, salary_score: 7, location_score: 6, status: "monitorando", notes: "310 vagas adicionais criadas em jul/2026." },
  // Países: análise do caminho para a Europa
  { external_id: "t-ie", track: "europa", kind: "country", name: "Irlanda: Critical Skills Employment Permit", location: "Dublin / Cork", compatibility: 9.5, difficulty: 2, salary_score: 8, location_score: 9, status: "plano A", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/" },
  { external_id: "t-de", track: "europa", kind: "country", name: "Alemanha: EU Blue Card", location: "Berlim / Munique / Hamburgo", salary_text: "≥ €45.934/ano (recém-formado, 2026)", salary_value: 45934, currency: "EUR", compatibility: 9, difficulty: 1, salary_score: 9, location_score: 10, status: "plano B", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" },
  { external_id: "t-de-oc", track: "europa", kind: "country", name: "Alemanha: Opportunity Card", location: "Alemanha", salary_text: "comprovar €1.091/mês", compatibility: 8, difficulty: 3, salary_score: 7, location_score: 10, status: "plano C", url: "https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card" },
  { external_id: "t-nl", track: "europa", kind: "country", name: "Holanda: Highly Skilled Migrant", location: "Amsterdã / Roterdã", compatibility: 8, difficulty: 4, salary_score: 9, location_score: 9, status: "monitorando" },
  { external_id: "t-pt", track: "europa", kind: "country", name: "Portugal", location: "Lisboa / Porto", compatibility: 8, difficulty: 1, salary_score: 5, location_score: 7, status: "plano D" },
  { external_id: "t-au", track: "europa", kind: "country", name: "Austrália", location: "Sydney / Melbourne", compatibility: 7, difficulty: 5, salary_score: 9, location_score: 8, status: "paralelo" },
];

export const HABITS = [
  { external_id: "h-questions", name: "20 questões", cue: "Depois do almoço, antes de voltar ao trabalho", target_per_week: 6, color: "#3b5bdb", position: 0 },
  { external_id: "h-flashcards", name: "Flashcards do dia", cue: "Depois do café da manhã", target_per_week: 7, color: "#8b5cf6", position: 1 },
  { external_id: "h-english", name: "Inglês 30 min", cue: "Às 21h, depois do banho", target_per_week: 6, color: "#e8a33d", position: 2 },
  { external_id: "h-listening", name: "Listening no trajeto", cue: "Ao entrar no carro/ônibus", target_per_week: 5, color: "#f0b85e", position: 3 },
  { external_id: "h-code", name: "45 min de automação/portfólio", cue: "Seg, qua e sex depois do jantar", target_per_week: 3, color: "#2f9e6b", position: 4 },
  { external_id: "h-exercise", name: "Exercício físico", cue: "Ao acordar, antes do celular", target_per_week: 4, color: "#c2410c", position: 5 },
];

export const FUNDS = [
  { external_id: "f-move", name: "Reserva de mudança (Europa)", target_amount: 60000, currency: "BRL", target_date: "2027-09-30" },
  { external_id: "f-emergency", name: "Reserva de emergência", target_amount: 24000, currency: "BRL" },
];

export const PLANNED_COSTS = [
  { external_id: "c-psm", track: "certificacoes", name: "Voucher PSM I", category: "Certificação", amount: 200, currency: "USD", due_date: "2026-10-25" },
  { external_id: "c-cobit", track: "certificacoes", name: "Exame COBIT 2019 Foundation", category: "Certificação", amount: 175, currency: "USD", due_date: "2026-11-20" },
  { external_id: "c-itil", track: "certificacoes", name: "ITIL Foundation (bundle oficial)", category: "Certificação", amount: 690, currency: "USD", due_date: "2027-01-15", notes: "Parceiros no Brasil: R$ 2.630–3.640." },
  { external_id: "c-istqb", track: "certificacoes", name: "ISTQB CTFL (BSTQB): confirmar valor", category: "Certificação", amount: 700, currency: "BRL", due_date: "2027-04-15" },
  { external_id: "c-opp-card", track: "europa", name: "Comprovação financeira Opportunity Card (12 × €1.091)", category: "Visto", amount: 13092, currency: "EUR", notes: "Só se seguir o plano C." },
  { external_id: "c-flight", track: "europa", name: "Passagem só de ida (estimativa)", category: "Mudança", amount: 5000, currency: "BRL" },
  { external_id: "c-first-month", track: "europa", name: "Primeiro mês: caução + aluguel (estimativa)", category: "Mudança", amount: 4000, currency: "EUR" },
];

export const TASKS = [
  { external_id: "tk-scrum-guide", title: "Ler o Scrum Guide 2020 (PT-BR)", status: "todo", priority: 1, goal: "g-psm" },
  { external_id: "tk-scrum-open", title: "Fazer o Scrum Open na Scrum.org e anotar os erros", status: "todo", priority: 1, goal: "g-psm" },
  { external_id: "tk-itil-rh", title: "Perguntar ao RH qual versão do ITIL é exigida", status: "todo", priority: 1, goal: "g-itil" },
  { external_id: "tk-cv", title: "Traduzir e reposicionar o currículo (QA Engineer / SDET)", status: "backlog", priority: 2, goal: "g-eu-profile" },
  { external_id: "tk-linkedin", title: "LinkedIn em inglês: headline, about e experiências", status: "backlog", priority: 2, goal: "g-eu-profile" },
  { external_id: "tk-pw-project", title: "Projeto 1: suíte Playwright E2E com relatório no GitHub Pages", status: "backlog", priority: 2, goal: "g-eu-portfolio" },
  { external_id: "tk-api-project", title: "Projeto 2: testes de API (contrato + carga leve) com CI", status: "backlog", priority: 2, goal: "g-eu-portfolio" },
  { external_id: "tk-edital-cidasc", title: "Baixar edital CIDASC e mapear conteúdo × núcleo técnico", status: "backlog", priority: 3, goal: "g-conc-base" },
];
