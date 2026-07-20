#!/usr/bin/env node
/**
 * Verifica invariantes de publicación de notas.
 * Ejecutar antes de deploy: npm run check:notes
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function read(relPath) {
  return readFileSync(resolve(root, relPath), "utf8");
}

function fail(message) {
  failures.push(message);
}

const idPage = read("src/pages/notas/[id].astro");
if (!idPage.includes("resolvePublishedNoteById")) {
  fail("[id].astro debe usar resolvePublishedNoteById");
}
if (idPage.includes("isNoteScheduledForFuture")) {
  fail("[id].astro no debe filtrar con isNoteScheduledForFuture (usar SQL)");
}
if (idPage.includes("fetchNoteWithFallback")) {
  fail("[id].astro no debe duplicar lógica HTTP; usar load-published-note.ts");
}

const dbUrl = read("src/lib/database-url.ts");
if (!dbUrl.includes("NETLIFY_DATABASE_URL")) {
  fail("database-url.ts debe priorizar NETLIFY_DATABASE_URL");
}

const netlifyGetNotes = read("netlify/functions/get-notes.ts");
if (netlifyGetNotes.includes("isNoteScheduledForFuture(note.scheduled_at)")) {
  fail("get-notes (Netlify) no debe bloquear notas publicadas con JS");
}

const loadNote = read("src/lib/load-published-note.ts");
if (!loadNote.includes("queryNoteById")) {
  fail("load-published-note.ts debe intentar BD antes que HTTP");
}

if (failures.length > 0) {
  console.error("check:notes falló:\n");
  for (const item of failures) {
    console.error(`  - ${item}`);
  }
  process.exit(1);
}

console.log("check:notes OK — invariantes de publicación verificadas");
