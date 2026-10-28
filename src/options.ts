import { parseArgs } from "node:util";

export interface Options {
  owner: string;
  repo: string;
  json: boolean;
  staleDays: number;
}

export const USAGE = `RepoPulse v0.1.0 — GitHub repository health from your terminal

Usage:
  npm start -- OWNER/REPO [--json] [--stale-days N]
  npm start -- --help

Options:
  --json          Print a machine-readable JSON report
  --stale-days N  Threshold for aging pull requests (default: 14)
  -h, --help      Show this help

Authentication:
  Optional GH_TOKEN or GITHUB_TOKEN environment variable for private repos
  and higher API rate limits. Never commit tokens into your repository.
`;

export function parseCommandArgs(args: string[]): Options | null {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      json: { type: "boolean" },
      "stale-days": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) return null;
  if (positionals.length !== 1) {
    throw new Error("Expected exactly one repository in OWNER/REPO format.");
  }
  const slug = positionals[0] ?? "";
  const parts = slug.split("/");
  const owner = parts[0] ?? "";
  const repo = parts[1] ?? "";
  if (
    parts.length !== 2 ||
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(owner) ||
    !/^[a-z\d._-]+$/i.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    throw new Error("Invalid repository. Use OWNER/REPO, for example octocat/Hello-World.");
  }

  const rawStaleDays = values["stale-days"] ?? "14";
  const staleDays = Number(rawStaleDays);
  if (!Number.isSafeInteger(staleDays) || staleDays < 1 || staleDays > 365) {
    throw new Error("--stale-days must be an integer between 1 and 365.");
  }
  return { owner, repo, json: values.json ?? false, staleDays };
}
