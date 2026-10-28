import type {
  RepositoryData,
  RepositoryReport,
  PullRequestInsight,
} from "./types.ts";

const MS_PER_DAY = 86_400_000;

export function buildReport(
  data: RepositoryData,
  now: Date = new Date(),
  staleDays = 14,
): RepositoryReport {
  const openedIssues = data.issues.items.filter((issue) => !issue.pull_request);
  const pullInsights: PullRequestInsight[] = data.pulls.items.map((pull) => ({
    number: pull.number,
    title: pull.title,
    url: pull.html_url,
    author: pull.user?.login ?? "unknown",
    ageDays: Math.max(0, Math.floor((now.getTime() - Date.parse(pull.created_at)) / MS_PER_DAY)),
    draft: pull.draft,
  }));
  pullInsights.sort((a, b) => b.ageDays - a.ageDays || a.number - b.number);

  const warnings: string[] = [];
  if (data.pulls.truncated) warnings.push("Pull request results are capped at 1,000 items; counts may be incomplete.");
  if (data.issues.truncated) warnings.push("Issue results are capped at 1,000 items (including pull requests); counts may be incomplete.");
  warnings.push("Recent commits sampled: up to 30 latest commits, not the repository's lifetime total.");

  return {
    generatedAt: now.toISOString(),
    repository: {
      fullName: data.repository.full_name,
      url: data.repository.html_url,
      description: data.repository.description,
      defaultBranch: data.repository.default_branch,
      stars: data.repository.stargazers_count,
      forks: data.repository.forks_count,
    },
    metrics: {
      openPullRequests: data.pulls.items.length,
      stalePullRequests: pullInsights.filter((pull) => pull.ageDays >= staleDays).length,
      openIssues: openedIssues.length,
      recentCommitsSampled: data.commits.length,
    },
    oldestPullRequests: pullInsights.slice(0, 10),
    recentIssues: openedIssues.slice(0, 10).map((issue) => ({
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
    })),
    warnings,
  };
}

export function formatText(report: RepositoryReport, staleDays: number): string {
  const { repository: repo, metrics } = report;
  const lines: string[] = [
    `RepoPulse — ${repo.fullName}`,
    repo.url,
    `Generated: ${report.generatedAt}`,
    "",
    `Stars: ${repo.stars} | Forks: ${repo.forks} | Default branch: ${repo.defaultBranch}`,
    `Open pull requests: ${metrics.openPullRequests}`,
    `Aging pull requests (>= ${staleDays} days): ${metrics.stalePullRequests}`,
    `Open issues (excluding PRs): ${metrics.openIssues}`,
    `Recent commits sampled: ${metrics.recentCommitsSampled}`,
    "",
    "Oldest open pull requests:",
  ];
  if (report.oldestPullRequests.length === 0) lines.push("  None");
  for (const pull of report.oldestPullRequests) {
    lines.push(`  #${pull.number} ${pull.title} — ${pull.ageDays}d (${pull.author})${pull.draft ? " [draft]" : ""}`);
    lines.push(`    ${pull.url}`);
  }

  lines.push("", "Open issues (up to 10):");
  if (report.recentIssues.length === 0) lines.push("  None");
  for (const issue of report.recentIssues) {
    lines.push(`  #${issue.number} ${issue.title}`, `    ${issue.url}`);
  }
  lines.push("", "Notes:");
  for (const warning of report.warnings) lines.push(`  - ${warning}`);
  return lines.join("\n");
}
