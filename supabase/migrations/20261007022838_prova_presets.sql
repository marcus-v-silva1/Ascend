-- Provas anteriores importadas viram um simulado fiel: todas as questões com a
-- etiqueta da prova, na ordem e no tempo originais.
alter table public.exam_presets add column tag text;

create index questions_tags_idx on public.questions using gin (tags);
