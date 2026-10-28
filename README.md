# RepoPulse

**Repository intelligence from your terminal, powered by GitHub's REST API.**

RepoPulse is a small, open-source, read-only TypeScript CLI for inspecting a GitHub repository's pull requests, open issues, recent commits, and basic popularity metrics. It is a real GitHub API integration, designed to be easy to review and extend.

## Features

- Repository metadata: stars, forks, and default branch
- Open pull requests, including aging PRs (14+ days by default)
- Open issues, excluding pull requests also returned by GitHub's Issues API
- A sample of the 30 most recent commits
- Human-readable terminal output or structured JSON
- Pagination with a documented 1,000-item safety cap
- No database, AI API key, or write permissions required

## Quick start

Requirements: **Node.js 22.18+** and npm.

```bash
git clone https://github.com/Martin-Aziz/RepoPulse.git
cd RepoPulse
npm install
npm start -- Martin-Aziz/RepoPulse
```

Structured JSON:

```bash
npm start -- Martin-Aziz/RepoPulse --json
```

Custom aging threshold:

```bash
npm start -- octocat/Hello-World --stale-days 30
```

See all options:

```bash
npm start -- --help
```

### Authentication (optional)

Public repositories can be queried without authentication, subject to GitHub's lower anonymous API rate limits.

For private repositories or higher rate limits, set **`GH_TOKEN`** (preferred) or **`GITHUB_TOKEN`** in your environment before running RepoPulse. For fine-grained tokens, grant access only to the repositories you intend to inspect, with read-only **Metadata**, **Contents**, **Issues**, and **Pull requests** permissions as applicable.

**Never commit a token, put it in a URL, or paste it into a public issue.** RepoPulse sends it exclusively in the `Authorization` request header.

### Run checks

```bash
npm run check
```

The check command runs TypeScript type checking and the Node.js built-in test suite. GitHub Actions runs the same checks for pushes to `main` and pull requests.

## Output and limitations

RepoPulse reports **currently open** issues and pull requests, not historical totals. The GitHub Issues endpoint includes pull requests; RepoPulse filters those out of the issue count.

For safety and bounded API usage, RepoPulse fetches a maximum of 10 pages of 100 items each for issues and pull requests. If a result reaches the cap, it includes a warning that counts might be incomplete. The commit metric is expressly the number of **recent commits sampled (up to 30)**, not lifetime commits. Pull requests aged at least `--stale-days` days are counted as aging, including drafts.

JSON output contains `generatedAt`, `repository`, `metrics`, `oldestPullRequests`, `recentIssues`, and `warnings`, suitable for scripts and future UI integrations.

## Project structure

```text
src/cli.ts          CLI entrypoint and exit codes
src/options.ts      Argument parsing and validation
src/github.ts       GitHub REST client and bounded pagination
src/report.ts       Analysis and human-readable formatter
src/types.ts        API and report types
test/               Offline unit tests with mocked API responses
.github/workflows/  CI checks
```

## Developer Program

RepoPulse demonstrates use of the GitHub API. Building or publishing this repository **does not by itself award** the GitHub Developer Program Member highlight. See the [GitHub Developer Program](https://docs.github.com/en/integrations/concepts/github-developer-program) for the current account and integration eligibility requirements.

## Security

RepoPulse is read-only and never modifies repositories. API requests have a 15-second timeout and use GitHub's documented API version. If using private repository tokens, use the minimum permissions possible.

## License

MIT. See [LICENSE](LICENSE).
