# Glow-Up

App pessoal para estudos, carreira, hábitos e finanças: questões e simulados com revisão espaçada, flashcards (FSRS), plano de carreira com OKRs, ranking de concursos e rotas para a Europa, Kanban, hábitos, Pomodoro, revisão semanal, reserva de mudança e acompanhamento do inglês.

Stack: Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 + shadcn/ui (Base UI) · Supabase (Postgres, Auth, RLS) · ts-fsrs · Vitest · Playwright · Vercel.

## Rodar localmente

Pré-requisitos: Node 24 e, para o banco local, Docker Desktop.

```bash
npm install
cp .env.example .env.local
npm run db:start        # sobe o Supabase local e aplica as migrations
npm run dev
```

`npm run db:start` imprime `API URL` e `anon key`; cole em `.env.local`. Crie seu usuário no Studio local (http://127.0.0.1:54323 → Authentication → Add user, com senha) usando o mesmo e-mail de `OWNER_EMAIL`.

No primeiro login o app carrega sozinho o conteúdo inicial (trilhas, metas, alvos, hábitos, 162 questões e decks). Novos conteúdos em `src/content` chegam ao banco quando você aumenta `CONTENT_VERSION` em `src/lib/content/bootstrap.ts`; o seed só insere o que falta e nunca sobrescreve suas edições.

## Deploy (Supabase + Vercel)

1. **Supabase**: crie um projeto em supabase.com e aplique o schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   ```
2. **Usuário dono**: Authentication → Users → *Add user* com seu e-mail e senha (marque *Auto confirm*).
3. **Fechar cadastros**: Authentication → Sign In / Providers → desative *Allow new users to sign up*. O app também barra qualquer e-mail diferente de `OWNER_EMAIL`, e o RLS isola os dados por usuário.
4. **URLs de auth**: Authentication → URL Configuration → *Site URL* = URL da Vercel; adicione `https://<seu-app>.vercel.app/auth/callback` em *Redirect URLs* (necessário para o login por link).
5. **Vercel**: importe o repositório do GitHub e configure as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OWNER_EMAIL`

   Cada PR ganha um deploy de preview; o push na `main` vai para produção.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript |
| `npm test` | Testes unitários (Vitest): FSRS, correção, seleção intercalada, finanças, hábitos, CSV e validação de todo o conteúdo |
| `npm run test:e2e` | Testes E2E (Playwright) contra Supabase **local** |
| `npm run db:types` | Gera tipos TypeScript a partir do banco local |
| `npm run times:sync` | Sincroniza seu progresso da Times (veja abaixo) |

### Testes E2E

Precisam do Supabase local rodando e destas variáveis (valores de teste, nunca de produção):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key local>
SUPABASE_SERVICE_ROLE_KEY=<service role key local>
OWNER_EMAIL=e2e-owner@glowup.test
E2E_PASSWORD=<qualquer senha de teste>
```

O setup cria o usuário de teste e salva a sessão. No GitHub Actions isso é automático (`.github/workflows/ci.yml`).

## Inglês: sincronização com a Times

```bash
npm run times:sync
```

Abre um navegador com perfil próprio (`.times-session/`, fora do git). Você faz login na Times Digital Books e na Times Connected, navega pelos seus cursos e fecha a janela. O script grava as respostas das plataformas em `.times-data/raw/` e gera `times-export.json`, que você importa em **Inglês → Importar times-export.json**. A senha é digitada só por você no navegador e nunca fica no código.

O mapeamento das respostas é heurístico até conhecermos o formato exato das APIs da Times. Se a importação vier vazia, os arquivos de `.times-data/raw/` mostram o formato para ajustar `scripts/times-sync.mjs`.

## Importar questões

Em **Questões → Banco de questões → Importar em lote**, envie um JSON:

```json
[
  {
    "subject": "conc-redes",
    "stem": "O protocolo DNS usa a porta 53.",
    "correct": true,
    "explanation": "DNS usa a porta 53 (UDP e TCP).",
    "board": "Cebraspe",
    "year": 2024
  },
  {
    "subject": "psm-eventos",
    "stem": "Qual é o timebox da Daily Scrum?",
    "options": ["15 minutos", "30 minutos", "1 hora"],
    "correct": [0],
    "explanation": "A Daily Scrum tem 15 minutos."
  }
]
```

`subject` aceita o código do assunto (veja `src/content/subjects.ts`) ou o nome.

### Provas anteriores oficiais

1. Baixe o caderno e o gabarito definitivo no site da banca para `provas/pdf/` (a pasta `provas/` fica fora do git: é material para uso pessoal).
2. Extraia o texto: `pdftotext -enc UTF-8 provas/pdf/<arquivo>.pdf provas/txt/<arquivo>.txt`
3. Descreva a prova em `provas/config.json` (formatos `fgv` e `ufsc`, título do bloco no gabarito, duração) e rode:
   ```bash
   python -X utf8 scripts/parse-prova.py --config provas/config.json
   ```
4. Importe `provas/json/<slug>.json` em **Banco de questões → Importar em lote**. A prova vira um simulado com todas as questões na ordem e no tempo originais. Questões repetidas entre provas (ex.: conhecimentos gerais iguais em vários perfis) são reaproveitadas, não duplicadas.

O conversor exclui questões anuladas e as que dependem de figura sem texto, e marca com "[Confira … no PDF original]" as que têm código ou tabela cuja formatação pode ter se perdido. `npm test` valida os JSONs gerados quando a pasta existe. As questões que acompanham o app são originais, escritas a partir do Scrum Guide 2020 (CC BY-SA 4.0) e dos syllabi públicos de COBIT 2019, ITIL 4, ISTQB CTFL e editais de TI.

## Estrutura

```
src/app/(app)/        páginas autenticadas (dashboard, estudos, flashcards, inglês, carreira, gestão, finanças)
src/app/login/        login por senha ou link mágico
src/content/          conteúdo inicial versionado (plano, questões, decks)
src/lib/              regras puras e testadas (srs, grading, study, finance, habits, csv, dates)
src/proxy.ts          renova a sessão e barra quem não é o dono
supabase/migrations/  schema com RLS
tests/unit, tests/e2e
```
