#!/usr/bin/env node
// Sincroniza seu progresso da Times Digital Books e Times Connected.
//
// Uso:
//   npm run times:sync            abre o navegador; faça login e navegue pelos seus cursos
//   npm run times:sync -- --map   só remapeia o que já foi capturado
//
// Como funciona:
// - Usa um perfil de navegador próprio em .times-session/ (fica só na sua máquina e no
//   .gitignore). Seu login é digitado por você na janela; o script nunca vê nem guarda senha.
// - Enquanto você navega, grava as respostas JSON das plataformas em .times-data/raw/.
// - Ao fechar o navegador, converte o que encontrou em times-export.json, que você
//   importa na página Inglês do app.

import { chromium } from "@playwright/test";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SITES = [
  { platform: "times_digital_books", url: "https://new.timesdigitalbooks.com/#/home", host: "timesdigitalbooks.com" },
  { platform: "times_connected", url: "https://timesconnected.com.br/#/home", host: "timesconnected.com.br" },
];
const SESSION_DIR = ".times-session";
const RAW_DIR = join(".times-data", "raw");
const OUTPUT = "times-export.json";

async function capture() {
  await mkdir(RAW_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    viewport: null,
    args: ["--start-maximized"],
  });

  let saved = 0;
  context.on("response", async (response) => {
    try {
      const url = new URL(response.url());
      const site = SITES.find((s) => url.hostname.endsWith(s.host));
      if (!site) return;
      const type = response.headers()["content-type"] ?? "";
      if (!type.includes("json") || response.status() >= 400) return;
      const body = await response.json();
      const name = `${site.platform}__${Date.now()}__${url.pathname.replace(/[^\w]+/g, "_").slice(0, 80)}.json`;
      await writeFile(join(RAW_DIR, name), JSON.stringify({ url: response.url(), platform: site.platform, body }, null, 2));
      saved++;
    } catch {
      // resposta sem corpo ou não-JSON: ignora
    }
  });

  const pages = context.pages();
  const first = pages[0] ?? (await context.newPage());
  await first.goto(SITES[0].url);
  const second = await context.newPage();
  await second.goto(SITES[1].url);

  console.log("\nNavegador aberto.");
  console.log("1. Faça login nas duas abas, se pedir.");
  console.log("2. Abra seus cursos, livros e a tela de progresso/notas de cada plataforma.");
  console.log("3. Feche o navegador quando terminar.\n");

  await new Promise((resolve) => context.on("close", resolve));
  console.log(`${saved} respostas capturadas.`);
}

// ---------------------------------------------------------------------------
// Mapeamento heurístico: procura listas de unidades/lições com título e progresso.
// Ajuste aqui quando conhecermos o formato exato das APIs da Times.
// ---------------------------------------------------------------------------
const TITLE_KEYS = ["title", "titulo", "name", "nome", "description", "descricao"];
const PROGRESS_KEYS = ["progress", "progresso", "percent", "percentage", "porcentagem", "completed", "concluido", "concluida", "done", "finished", "status", "score", "nota", "grade"];
const ID_KEYS = ["id", "_id", "uuid", "code", "codigo", "slug"];

const pick = (obj, keys) => {
  for (const k of Object.keys(obj)) if (keys.includes(k.toLowerCase())) return obj[k];
  return undefined;
};

function unitStatus(u) {
  const v = pick(u, ["completed", "concluido", "concluida", "done", "finished"]);
  if (v === true) return "done";
  const p = Number(pick(u, ["progress", "progresso", "percent", "percentage", "porcentagem"]));
  if (Number.isFinite(p)) return p >= 100 || (p > 0 && p <= 1 && p === 1) ? "done" : p > 0 ? "doing" : "todo";
  const s = String(pick(u, ["status"]) ?? "").toLowerCase();
  if (/(complet|conclu|done|finish|aprov)/.test(s)) return "done";
  if (/(progress|andamento|start|inici)/.test(s)) return "doing";
  return "todo";
}

function looksLikeUnitList(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return false;
  const objs = arr.filter((x) => x && typeof x === "object" && !Array.isArray(x));
  if (objs.length < arr.length * 0.8) return false;
  const withTitle = objs.filter((o) => typeof pick(o, TITLE_KEYS) === "string");
  const withProgress = objs.filter((o) => pick(o, PROGRESS_KEYS) !== undefined);
  return withTitle.length >= objs.length * 0.8 && withProgress.length >= objs.length * 0.5;
}

function findLists(node, parent, out, depth = 0) {
  if (depth > 8 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    if (looksLikeUnitList(node)) out.push({ list: node, parent });
    for (const item of node) findLists(item, parent, out, depth + 1);
    return;
  }
  for (const value of Object.values(node)) findLists(value, node, out, depth + 1);
}

function findVocab(node, out, depth = 0) {
  if (depth > 8 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) findVocab(item, out, depth + 1);
    return;
  }
  const word = pick(node, ["word", "palavra", "term", "termo", "expression", "expressao"]);
  const meaning = pick(node, ["meaning", "significado", "translation", "traducao", "definition", "definicao"]);
  if (typeof word === "string" && typeof meaning === "string") out.push({ word: word.trim(), meaning: meaning.trim() });
  for (const value of Object.values(node)) findVocab(value, out, depth + 1);
}

async function map() {
  let files = [];
  try {
    files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    console.error("Nada capturado ainda. Rode `npm run times:sync` primeiro.");
    process.exit(1);
  }

  const courses = new Map();
  const vocab = new Map();
  for (const f of files) {
    const { platform, body } = JSON.parse(await readFile(join(RAW_DIR, f), "utf8"));
    const lists = [];
    findLists(body, null, lists);
    for (const { list, parent } of lists) {
      const courseTitle = (parent && pick(parent, TITLE_KEYS)) || `Curso ${courses.size + 1}`;
      const courseRef = String((parent && pick(parent, ID_KEYS)) ?? courseTitle);
      const key = `${platform}:${courseRef}`;
      const course = courses.get(key) ?? { platform, ref: courseRef, title: String(courseTitle), level: parent ? String(pick(parent, ["level", "nivel", "stage", "estagio"]) ?? "") || null : null, units: [] };
      list.forEach((u, i) => {
        const title = String(pick(u, TITLE_KEYS));
        const ref = String(pick(u, ID_KEYS) ?? title);
        if (course.units.some((x) => x.ref === ref)) return;
        const rawScore = Number(pick(u, ["score", "nota", "grade"]));
        course.units.push({
          ref,
          title,
          position: i,
          status: unitStatus(u),
          score: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore <= 10 ? rawScore * 10 : rawScore)) : null,
          completedAt: null,
        });
      });
      courses.set(key, course);
    }
    const words = [];
    findVocab(body, words);
    for (const w of words) vocab.set(w.word.toLowerCase(), w);
  }

  const result = { exportedAt: new Date().toISOString(), courses: [...courses.values()], vocab: [...vocab.values()] };
  await writeFile(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`${OUTPUT}: ${result.courses.length} cursos, ${result.courses.reduce((s, c) => s + c.units.length, 0)} unidades, ${result.vocab.length} palavras.`);
  if (result.courses.length === 0) {
    console.log("Nenhuma lista de lições reconhecida. Mande os arquivos de .times-data/raw para ajustarmos o mapeamento.");
  }
}

if (!process.argv.includes("--map")) await capture();
await map();
