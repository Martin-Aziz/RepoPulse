#!/usr/bin/env node
import { fetchRepositoryData } from "./github.ts";
import { parseCommandArgs, USAGE } from "./options.ts";
import { buildReport, formatText } from "./report.ts";

async function main(): Promise<void> {
  let options;
  try {
    options = parseCommandArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  if (options === null) {
    console.log(USAGE);
    return;
  }

  try {
    const data = await fetchRepositoryData(options.owner, options.repo);
    const report = buildReport(data, new Date(), options.staleDays);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatText(report, options.staleDays));
  } catch (error) {
    console.error(`RepoPulse failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

await main();
