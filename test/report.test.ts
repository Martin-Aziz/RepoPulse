import assert from "node:assert/strict";
import test from "node:test";
import { buildReport, formatText } from "../src/report.ts";
import type { RepositoryData } from "../src/types.ts";

const data: RepositoryData = {
  repository: {
    full_name: "octocat/Hello-World",
    html_url: "https://github.com/octocat/Hello-World",
    description: "A sample",
    default_branch: "main",
    stargazers_count: 15,
    forks_count: 3,
  },
  pulls: {
    truncated: false,
    items: [
      { number: 4, title: "Old PR", html_url: "https://github.com/o/r/pull/4", created_at: "2026-10-01T00:00:00Z", draft: false, user: { login: "octocat" } },
      { number: 5, title: "Fresh PR", html_url: "https://github.com/o/r/pull/5", created_at: "2026-10-25T00:00:00Z", draft: true, user: null },
    ],
  },
  issues: {
    truncated: false,
    items: [
      { number: 2, title: "Bug", html_url: "https://github.com/o/r/issues/2", created_at: "2026-10-12T00:00:00Z" },
      { number: 4, title: "PR in issues feed", html_url: "https://github.com/o/r/issues/4", created_at: "2026-10-01T00:00:00Z", pull_request: {} },
    ],
  },
  commits: [{ sha: "abc", commit: { author: { date: "2026-10-28T00:00:00Z" } } }],
};

test("counts only issues, not pull requests, and identifies aging PRs", () => {
  const report = buildReport(data, new Date("2026-10-28T00:00:00Z"), 14);
  assert.deepEqual(report.metrics, {
    openPullRequests: 2, stalePullRequests: 1, openIssues: 1, recentCommitsSampled: 1,
  });
  assert.equal(report.oldestPullRequests[0]?.number, 4);
  assert.equal(report.oldestPullRequests[0]?.ageDays, 27);
  assert.equal(report.recentIssues[0]?.number, 2);
  assert.match(formatText(report, 14), /Aging pull requests \(>= 14 days\): 1/);
});

test("keeps report counts transparent when pagination is truncated", () => {
  const report = buildReport({
    ...data,
    pulls: { ...data.pulls, truncated: true },
    issues: { ...data.issues, truncated: true },
  }, new Date("2026-10-28T00:00:00Z"));
  assert.ok(report.warnings.some((line) => line.includes("Pull request results")));
  assert.ok(report.warnings.some((line) => line.includes("Issue results")));
});

test("includes empty state for zero open issues and pull requests", () => {
  const report = buildReport({
    ...data,
    pulls: { items: [], truncated: false },
    issues: { items: [], truncated: false },
  });
  assert.match(formatText(report, 14), /Oldest open pull requests:\n  None/);
  assert.equal(report.metrics.openIssues, 0);
});
