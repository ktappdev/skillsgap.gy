import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const checkerPath = resolve(repositoryRoot, "scripts/check-processor-webhook-migration.mjs");
const temporaryDirectories: string[] = [];

function createMigrations(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "skillsgap-webhook-migrations-"));
  temporaryDirectories.push(directory);
  for (const [filename, contents] of Object.entries(files)) {
    writeFileSync(join(directory, filename), contents);
  }
  return directory;
}

function migration(body: string, declaration = "create or replace function public.enqueue_resume_processor_webhook()") {
  return `${declaration}\nreturns trigger\nlanguage plpgsql\nas $fn$\nbegin\n${body}\nend;\n$fn$;\n`;
}

function runChecker(migrationsDirectory?: string) {
  return spawnSync(process.execPath, [checkerPath, ...(migrationsDirectory ? [migrationsDirectory] : [])], {
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("processor webhook migration check", () => {
  it("passes against the real migrations directory", () => {
    const result = runChecker();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("20260924203000_guard_processor_webhook_dispatch.sql");
  });

  it("fails when the winning definition omits recalculate_matches", () => {
    const migrationsDirectory = createMigrations({
      "20260101_webhook.sql": migration("return new;\nexception\n  when others then return new;"),
    });

    const result = runChecker(migrationsDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("missing recalculate_matches");
    expect(result.stderr).toContain("20260101_webhook.sql");
  });

  it("fails when the winning definition omits the exception handler", () => {
    const migrationsDirectory = createMigrations({
      "20260101_webhook.sql": migration("if new.kind::text = 'recalculate_matches' then return new; end if;\nreturn new;"),
    });

    const result = runChecker(migrationsDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("missing exception handler");
  });

  it("fails when no webhook function definition exists", () => {
    const migrationsDirectory = createMigrations({ "20260101_other.sql": "select 1;\n" });

    const result = runChecker(migrationsDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no function definition for enqueue_resume_processor_webhook");
  });

  it("recognizes a later CREATE FUNCTION declaration without OR REPLACE", () => {
    const migrationsDirectory = createMigrations({
      "20260101_older.sql": migration("if new.kind::text = 'recalculate_matches' then return new; end if;\nexception when others then return new;"),
      "20260102_newer.sql": migration("return new;\nexception when others then return new;", "CREATE FUNCTION \"public\".\"enqueue_resume_processor_webhook\"()"),
    });

    const result = runChecker(migrationsDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("winning definition in 20260102_newer.sql");
    expect(result.stderr).toContain("missing recalculate_matches");
  });

  it("does not accept required tokens that occur only in comments", () => {
    const migrationsDirectory = createMigrations({
      "20260101_webhook.sql": migration("-- recalculate_matches\n/* exception when others then return new; */\nreturn new;"),
    });

    const result = runChecker(migrationsDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("missing recalculate_matches; missing exception handler");
  });

  it("fails when a later migration file sorts after the winning definition", () => {
    const migrationsDirectory = createMigrations({
      "20260101_webhook.sql": migration("if new.kind::text = 'recalculate_matches' then return new; end if;\nexception when others then return new;"),
      "20260102_unrelated.sql": "select 1;\n",
    });

    const result = runChecker(migrationsDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("winning definition is not in the last-sorting migration");
  });
});
