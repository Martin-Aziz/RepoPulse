import assert from "node:assert/strict";
import test from "node:test";
import { parseCommandArgs } from "../src/options.ts";

test("parses a repository and JSON option", () => {
  assert.deepEqual(parseCommandArgs(["Martin-Aziz/RepoPulse", "--json"]), {
    owner: "Martin-Aziz", repo: "RepoPulse", json: true, staleDays: 14,
  });
});

test("accepts a custom aging threshold", () => {
  assert.equal(parseCommandArgs(["acme/rocket", "--stale-days", "30"])?.staleDays, 30);
});

test("help does not require a repository", () => {
  assert.equal(parseCommandArgs(["--help"]), null);
});

test("rejects malformed repositories and invalid thresholds", () => {
  for (const args of [
    [], ["owner"], ["owner/repo/extra"], ["-bad/repo"],
    ["owner/repo", "--stale-days", "0"],
    ["owner/repo", "--stale-days", "2.5"],
    ["owner/repo", "--stale-days", "abc"],
  ]) assert.throws(() => parseCommandArgs(args));
});
