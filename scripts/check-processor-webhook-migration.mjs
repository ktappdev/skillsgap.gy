#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultMigrationsDirectory = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
const migrationsDirectory = resolve(process.argv[2] ?? defaultMigrationsDirectory);
const definitionPattern = /\bcreate\s+(?:or\s+replace\s+)?function\s+(?:(?:"[^"]+"|[a-z_][\w$]*)\s*\.\s*)?(?:"enqueue_resume_processor_webhook"|enqueue_resume_processor_webhook)\s*\(\s*\)/gi;
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((filename) => filename.endsWith(".sql"))
  .sort();

let winner;
for (const filename of migrationFiles) {
  const sql = readFileSync(resolve(migrationsDirectory, filename), "utf8");
  const definitions = [...sql.matchAll(definitionPattern)];
  if (definitions.length > 0) {
    winner = { filename, sql, definition: definitions.at(-1) };
  }
}

if (!winner) {
  console.error("Webhook migration check failed: no function definition for enqueue_resume_processor_webhook was found in the migrations directory.");
  process.exitCode = 1;
} else {
  const lastMigration = migrationFiles.at(-1);
  const declaration = winner.definition;
  const definitionAndFollowingSql = winner.sql.slice(declaration.index);
  const bodyMatch = /\bas\s+\$([a-z0-9_]*)\$([\s\S]*?)\$\1\$/i.exec(definitionAndFollowingSql);
  const bodyWithoutComments = (bodyMatch?.[2] ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\r\n]*/g, "");
  const issues = [];

  if (winner.filename !== lastMigration) {
    issues.push(`winning definition is not in the last-sorting migration (${lastMigration})`);
  }
  if (!/\brecalculate_matches\b/i.test(bodyWithoutComments)) issues.push("missing recalculate_matches");
  if (!/\bexception\s+when\s+(?:others|sqlstate\s+'[0-9a-z]{5}'|[a-z_]\w*(?:\s+or\s+[a-z_]\w*)*)\s+then\b/i.test(bodyWithoutComments)) {
    issues.push("missing exception handler");
  }

  if (issues.length > 0) {
    console.error(`Webhook migration check failed: winning definition in ${winner.filename}: ${issues.join("; ")}.`);
    process.exitCode = 1;
  } else {
    console.log(`Webhook migration check passed: ${winner.filename} is the last migration and its definition includes recalculate_matches and an exception handler.`);
  }
}
