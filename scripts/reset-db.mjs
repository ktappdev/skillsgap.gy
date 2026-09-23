#!/usr/bin/env node
/**
 * Trash and reseed the SkillsGap.gy Supabase database, locally or on the linked
 * hosted project.
 *
 * Usage:
 *   pnpm reset:db --target local|production [--mode trash|reseed] [--dry-run]
 *   node --env-file=.env.local scripts/reset-db.mjs --target local|production [options]
 *
 * Options:
 *   --target <local|production>  Required and never defaulted.
 *   --mode <trash|reseed>        Defaults to trash.
 *   --confirm <project-ref>      Required for every production run; must equal the
 *                                project ref declared in supabase/config.toml.
 *   --yes                        Answer yes to the Supabase CLI's own prompts.
 *   --dry-run                    Print the resolved target and exact commands, then exit 0.
 *   --with-demo                  Re-provision demo accounts and run the readiness check.
 *   --backup [path]              Take a `supabase db dump` before a production trash.
 *   --force                      Override the NODE_ENV=production guard (forwarded to demo scripts).
 *   --help
 *
 * Safety:
 *   - Every run aborts unless supabase/config.toml `project_id` matches the project host in
 *     SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL, so the app and the wipe always name one project.
 *   - A production run additionally requires --confirm=<project-ref>; a stray --yes can never
 *     fire it on its own.
 *   - --mode trash destroys data. On production it truncates every auth.* table, so all hosted
 *     accounts, including the demo logins, are deleted and must be re-provisioned afterwards.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supabaseDirectory = join(repositoryRoot, "supabase");
const configPath = join(supabaseDirectory, "config.toml");
const migrationsDirectory = join(supabaseDirectory, "migrations");
const minimumCliVersion = "2.117.0";
const demoScripts = [
  "scripts/setup-demo-users.mjs",
  "scripts/prepare-demo-fallback.mjs",
  "scripts/check-demo-readiness.mjs",
];

const usage = `Usage:
  pnpm reset:db --target local|production [--mode trash|reseed] [--dry-run]
  node --env-file=.env.local scripts/reset-db.mjs --target local|production [options]

Options:
  --target <local|production>  Required and never defaulted.
  --mode <trash|reseed>        Defaults to trash.
  --confirm <project-ref>      Required for every production run.
  --yes                        Answer yes to the Supabase CLI's own prompts.
  --dry-run                    Print the resolved target and commands, then exit 0.
  --with-demo                  Re-provision demo accounts and run the readiness check.
  --backup [path]              Take a \`supabase db dump\` before a production trash.
  --force                      Override the NODE_ENV=production guard.
  --help

Run it through \`--env-file=.env.local\`: the target check compares supabase/config.toml
against SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL.`;

const options = {
  target: undefined,
  mode: "trash",
  confirm: undefined,
  yes: false,
  dryRun: false,
  withDemo: false,
  backup: undefined,
  backupRequested: false,
  force: false,
  help: false,
};

function fail(message) {
  console.error(`[reset-db] ERROR: ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`[reset-db] ${message}`);
}

function splitFlag(argument) {
  const separator = argument.indexOf("=");
  if (separator === -1) return [argument, undefined];
  return [argument.slice(0, separator), argument.slice(separator + 1)];
}

function parseArguments(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    const [name, inlineValue] = splitFlag(argument);
    const takeValue = () => {
      if (inlineValue !== undefined) return inlineValue;
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) fail(`${name} requires a value.`);
      index += 1;
      return next;
    };

    switch (name) {
      case "--target":
        options.target = takeValue();
        break;
      case "--mode":
        options.mode = takeValue();
        break;
      case "--confirm":
        options.confirm = takeValue();
        break;
      case "--backup":
        options.backupRequested = true;
        if (inlineValue !== undefined) {
          options.backup = inlineValue;
        } else if (argv[index + 1] !== undefined && !argv[index + 1].startsWith("--")) {
          index += 1;
          options.backup = argv[index];
        }
        break;
      case "--yes":
        options.yes = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--with-demo":
        options.withDemo = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        fail(`Unknown option: ${argument}\n\n${usage}`);
    }
  }
}

function readProjectRef(configText) {
  const match = configText.match(/^project_id\s*=\s*"([^"]+)"/m);
  if (match === null) fail(`Could not read project_id from supabase/config.toml.`);
  return match[1];
}

function readSeedConfiguration(configText) {
  const headerIndex = configText.indexOf("[db.seed]");
  if (headerIndex === -1) return { enabled: false, paths: [] };
  const remainder = configText.slice(headerIndex + "[db.seed]".length);
  const nextHeader = remainder.search(/^\[/m);
  const section = nextHeader === -1 ? remainder : remainder.slice(0, nextHeader);
  const paths = section.match(/sql_paths\s*=\s*\[([^\]]*)\]/);
  return {
    enabled: /^enabled\s*=\s*true\b/m.test(section),
    paths:
      paths === null
        ? []
        : paths[1]
            .split(",")
            .map((value) => value.trim().replace(/^"|"$/g, ""))
            .filter((value) => value.length > 0),
  };
}

function relativeSeedPath(seedConfiguration) {
  const entry = seedConfiguration.paths[0] ?? "seed.sql";
  return `supabase/${entry.replace(/^\.\//, "")}`;
}

function countMigrations() {
  try {
    return readdirSync(migrationsDirectory).filter((name) => name.endsWith(".sql")).length;
  } catch {
    return 0;
  }
}

function runCapture(command, args) {
  return spawnSync(command, args, { cwd: repositoryRoot, encoding: "utf8" });
}

function readCliVersion() {
  const result = runCapture("supabase", ["--version"]);
  if (result.error || result.status !== 0) return undefined;
  const match = `${result.stdout ?? ""}`.match(/(\d+\.\d+\.\d+)/);
  return match === null ? undefined : match[1];
}

function isVersionAtLeast(version, minimum) {
  if (version === undefined) return false;
  const current = version.split(".").map(Number);
  const required = minimum.split(".").map(Number);
  for (let index = 0; index < required.length; index += 1) {
    if (current[index] > required[index]) return true;
    if (current[index] < required[index]) return false;
  }
  return true;
}

function readEnvironmentHost(name) {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  try {
    return new URL(value).host;
  } catch {
    fail(`${name} is not a valid URL. Check .env.local and load it with --env-file=.env.local.`);
  }
}

function parseEnvironmentOutput(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match === null) continue;
    values[match[1]] = match[2].trim().replace(/^"(.*)"$/s, "$1");
  }
  return values;
}

let cachedLocalStackEnvironment;

function readLocalStackEnvironment() {
  if (cachedLocalStackEnvironment !== undefined) return cachedLocalStackEnvironment;
  const overrides = [
    "api.url=SUPABASE_URL",
    "auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY",
    "auth.publishable_key=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ];
  const result = runCapture("supabase", [
    "status",
    "-o",
    "env",
    ...overrides.flatMap((value) => ["--override-name", value]),
  ]);
  if (result.error || result.status !== 0) {
    fail("Could not read local stack credentials from `supabase status`. Start the stack first.");
  }
  const values = parseEnvironmentOutput(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  const url = values.SUPABASE_URL ?? values.API_URL;
  const serviceRoleKey = values.SUPABASE_SERVICE_ROLE_KEY ?? values.SERVICE_ROLE_KEY ?? values.SECRET_KEY;
  const publishableKey =
    values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? values.PUBLISHABLE_KEY ?? values.ANON_KEY;
  if (!url || !serviceRoleKey || !publishableKey) {
    fail("The local stack did not report a URL and API keys. Re-run `supabase start` and try again.");
  }
  cachedLocalStackEnvironment = {
    ...process.env,
    SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  };
  return cachedLocalStackEnvironment;
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function formatCommand(step) {
  const command = step.command === process.execPath ? "node" : step.command;
  return [command, ...step.args].map(shellQuote).join(" ");
}

function createSteps(projectRef, seedConfiguration) {
  const linkedTarget = ["--linked", "--project-ref", projectRef];
  const dockerCheck = {
    label: "Check that a container runtime is available",
    command: "docker",
    args: ["--version"],
    failureHint:
      "Install Docker Desktop or Podman and put `docker` on PATH. The local target cannot run without it.",
  };
  const startStack = {
    label: "Start the local Supabase stack",
    command: "supabase",
    args: ["start"],
  };
  const trashProduction = options.mode === "trash";
  const runDemoChain =
    options.withDemo || (options.target === "production" && trashProduction);
  const localDemoEnvironment = () =>
    readLocalStackEnvironment();
  const demoEnvironment =
    options.target === "production"
      ? { env: process.env, note: "" }
      : {
          env: localDemoEnvironment,
          note: " (local stack credentials from `supabase status`)",
        };

  if (options.target === "local") {
    const environment = demoEnvironment;
    return [
      dockerCheck,
      startStack,
      trashProduction
        ? {
            label: "Recreate the local database from migrations and seed data",
            command: "supabase",
            args: ["db", "reset"],
          }
        : {
            label: "Re-apply the seed data without dropping local data",
            command: "supabase",
            args: [
              "db",
              "query",
              "--local",
              "--file",
              relativeSeedPath(seedConfiguration),
            ],
          },
      ...(runDemoChain
        ? demoScripts.map((script) => ({
            label: `Run ${script}${environment.note}`,
            command: process.execPath,
            args: [script, ...(options.force ? ["--force"] : [])],
            env: environment.env,
          }))
        : []),
    ];
  }

  if (trashProduction) {
    const steps = [];
    if (options.backupRequested) {
      const backupPath = resolve(options.backup ?? `supabase/.backups/pre-reset-${Date.now()}.sql`);
      steps.push({
        label: "Dump the hosted database before wiping it",
        command: "supabase",
        args: ["db", "dump", ...linkedTarget, "--file", backupPath],
        discardStdout: true,
        before: () => mkdirSync(dirname(backupPath), { recursive: true }),
      });
    }
    steps.push({
      label: "Reset the hosted database from migrations and seed data",
      command: "supabase",
      args: ["db", "reset", ...linkedTarget, "--yes"],
    });
    steps.push(
      ...demoScripts.map((script) => ({
        label: `Run ${script}`,
        command: process.execPath,
        args: [script, ...(options.force ? ["--force"] : [])],
        env: process.env,
      })),
    );
    return steps;
  }

  const steps = [
    {
      label: "Push migrations and re-apply the seed data without dropping data",
      command: "supabase",
      args: ["db", "push", "--include-seed", ...linkedTarget, "--yes"],
    },
  ];
  if (options.withDemo) {
    steps.push(
      ...demoScripts.map((script) => ({
        label: `Run ${script}`,
        command: process.execPath,
        args: [script, ...(options.force ? ["--force"] : [])],
        env: process.env,
      })),
    );
  }
  return steps;
}

function printPlan(summary, steps) {
  log(`Target:       ${summary.target}`);
  log(`Project ref:  ${summary.projectRef}`);
  log(`Environment:  ${summary.environment}`);
  log(`Mode:         ${summary.mode}`);
  log(`Migrations:   ${summary.migrations} file(s) in supabase/migrations`);
  log(
    `Seed:         ${summary.seedEnabled ? `enabled (${summary.seedPaths.join(", ")})` : "disabled in supabase/config.toml"}`,
  );
  log(`Supabase CLI: ${summary.cliVersion ?? "not found"} (minimum ${minimumCliVersion})`);
  log(`Demo chain:   ${summary.demoChain ? "yes" : "no"}`);
  console.log("");
  log("Commands:");
  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.label}`);
    console.log(`     ${formatCommand(step)}`);
  });
}

function executeSteps(steps) {
  steps.forEach((step, index) => {
    console.log("");
    log(`[${index + 1}/${steps.length}] ${step.label}`);
    log(`  ${formatCommand(step)}`);
    const environment = typeof step.env === "function" ? step.env() : (step.env ?? process.env);
    if (typeof step.before === "function") step.before();
    const result = spawnSync(step.command, step.args, {
      cwd: repositoryRoot,
      env: environment,
      stdio: ["ignore", step.discardStdout === true ? "ignore" : "inherit", "inherit"],
    });
    if (result.error) {
      fail(`${step.failureHint ?? `Could not run ${formatCommand(step)}: ${result.error.message}`}`);
    }
    if (result.status !== 0) {
      fail(
        step.failureHint === undefined
          ? `Command failed with exit code ${result.status}: ${formatCommand(step)}`
          : `${step.failureHint} (exit code ${result.status})`,
      );
    }
  });
}

parseArguments(process.argv.slice(2));

if (options.help) {
  console.log(usage);
  process.exit(0);
}
if (options.target === undefined) fail(`Missing --target.\n\n${usage}`);
if (options.target !== "local" && options.target !== "production") {
  fail(`--target must be "local" or "production", received "${options.target}".`);
}
if (options.mode !== "trash" && options.mode !== "reseed") {
  fail(`--mode must be "trash" or "reseed", received "${options.mode}".`);
}
if (process.env.NODE_ENV === "production" && !options.force) {
  fail("Refusing to run with NODE_ENV=production. Pass --force after confirming the target.");
}
if (!existsSync(configPath)) fail(`Missing supabase/config.toml at ${configPath}.`);

const configText = readFileSync(configPath, "utf8");
const projectRef = readProjectRef(configText);
const seedConfiguration = readSeedConfiguration(configText);
const expectedHost = `${projectRef}.supabase.co`;

if (seedConfiguration.enabled && !existsSync(join(repositoryRoot, relativeSeedPath(seedConfiguration)))) {
  fail(`supabase/config.toml enables seeding but ${relativeSeedPath(seedConfiguration)} does not exist.`);
}

const environmentHosts = [
  ["SUPABASE_URL", readEnvironmentHost("SUPABASE_URL")],
  ["NEXT_PUBLIC_SUPABASE_URL", readEnvironmentHost("NEXT_PUBLIC_SUPABASE_URL")],
].filter(([, host]) => host !== undefined);

if (environmentHosts.length === 0) {
  fail(
    "SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL are both unset, so the target cannot be verified. Run with --env-file=.env.local.",
  );
}
for (const [name, host] of environmentHosts) {
  if (host !== expectedHost) {
    fail(
      `Aborting: ${name} points at ${host} but supabase/config.toml declares ${projectRef} (${expectedHost}).`,
    );
  }
}

if (options.target === "production") {
  if (options.confirm !== projectRef) {
    fail(
      "Refusing to run against the hosted project without an explicit token. " +
        `Re-run with --confirm=${projectRef} alongside --yes.`,
    );
  }
  if (!options.yes) {
    fail("Pass --yes so the Supabase CLI does not stop at its own confirmation prompt.");
  }
}

const cliVersion = readCliVersion();
if (!isVersionAtLeast(cliVersion, minimumCliVersion)) {
  const message = `supabase CLI ${cliVersion ?? "was not found"} is below the required ${minimumCliVersion}; earlier releases can silently skip a user schema during a linked reset.`;
  if (!options.dryRun) fail(message);
  log(`WARNING: ${message}`);
}

const demoChain = options.withDemo || (options.target === "production" && options.mode === "trash");
const summary = {
  target: options.target,
  projectRef,
  environment: environmentHosts.map(([name, host]) => `${name} → ${host}`).join(", "),
  mode: options.mode,
  migrations: countMigrations(),
  seedEnabled: seedConfiguration.enabled,
  seedPaths: seedConfiguration.paths,
  cliVersion,
  demoChain,
};

const steps = createSteps(projectRef, seedConfiguration);

if (options.mode === "trash") {
  console.log("");
  log(`DESTRUCTIVE: ${options.target} trash will drop data for project ${projectRef}.`);
  if (options.target === "production") {
    log("Every auth.* table is truncated by this reset: all hosted users, including the demo logins, are deleted.");
  }
}

if (options.dryRun) {
  console.log("");
  log("Dry run: nothing was executed.");
  printPlan(summary, steps);
  process.exit(0);
}

printPlan(summary, steps);
executeSteps(steps);

console.log("");
log(`Finished ${options.target} ${options.mode} for project ${projectRef}.`);
