@AGENTS.md

# Ascend — notas do projeto

- App de dono único: toda página autenticada chama `requireUser()` (`src/lib/auth.ts`); toda tabela tem `user_id` + RLS.
- Regras de negócio puras ficam em `src/lib/*.ts` com testes em `tests/unit`. Mantenha-as sem dependência de Supabase.
- Conteúdo inicial em `src/content`; ao adicionar, aumente `CONTENT_VERSION` em `src/lib/content/bootstrap.ts`. `tests/unit/content.test.ts` valida tudo.
- Next 16 com Cache Components: dados dinâmicos e `usePathname` ficam dentro de `<Suspense>`. Middleware se chama `proxy.ts`.
- Componentes shadcn usam Base UI: sem `asChild`; para link com cara de botão use `LinkButton`.
- Formulários: elementos nativos com classes `field`/`field-label` + `ActionForm` (`src/components/action-form.tsx`).
- Textos da interface em português, voz ativa, sem jargão.
- Antes de concluir: `npm run lint && npm run typecheck && npm test && npm run build`.
