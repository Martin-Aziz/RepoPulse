import type {
  GitHubCommit,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepository,
  PageResult,
  RepositoryData,
} from "./types.ts";

const BASE_URL = "https://api.github.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const REQUEST_TIMEOUT_MS = 15_000;

export class GitHubApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

export class GitHubClient {
  private readonly fetcher: typeof fetch;
  private readonly token: string | undefined;

  constructor(fetcher: typeof fetch = fetch, token?: string) {
    this.fetcher = fetcher;
    this.token = token;
  }

  async get<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "RepoPulse-CLI",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await this.fetcher(new URL(path, BASE_URL), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      let detail = response.statusText || "Request failed";
      try {
        const body: unknown = await response.json();
        if (typeof body === "object" && body !== null && "message" in body) {
          const message = (body as { message?: unknown }).message;
          if (typeof message === "string") detail = message;
        }
      } catch {
        // An HTML or empty error response is still reported by status.
      }
      const hint = response.status === 403 || response.status === 429
        ? " Check API rate limits or set GH_TOKEN for authenticated requests."
        : "";
      throw new GitHubApiError(response.status, `GitHub API ${response.status}: ${detail}.${hint}`);
    }

    return await response.json() as T;
  }

  async list<T>(path: string): Promise<PageResult<T>> {
    const items: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const join = path.includes("?") ? "&" : "?";
      const batch = await this.get<T[]>(`${path}${join}per_page=${PAGE_SIZE}&page=${page}`);
      if (!Array.isArray(batch)) {
        throw new Error("Unexpected GitHub API response: expected an array.");
      }
      items.push(...batch);
      if (batch.length < PAGE_SIZE) return { items, truncated: false };
    }
    return { items, truncated: true };
  }
}

/**
 * Public repositories work without credentials (subject to lower API rate limits).
 * Private repositories require a token with appropriate read-only permissions.
 */
export async function fetchRepositoryData(
  owner: string,
  name: string,
  client: GitHubClient = new GitHubClient(fetch, process.env.GH_TOKEN || process.env.GITHUB_TOKEN),
): Promise<RepositoryData> {
  const prefix = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const [repository, pulls, issues, commits] = await Promise.all([
    client.get<GitHubRepository>(prefix),
    client.list<GitHubPullRequest>(`${prefix}/pulls?state=open`),
    client.list<GitHubIssue>(`${prefix}/issues?state=open`),
    client.get<GitHubCommit[]>(`${prefix}/commits?per_page=30`).catch((error: unknown) => {
      // GitHub returns HTTP 409 when a repository has no commits.
      if (error instanceof GitHubApiError && error.status === 409) return [];
      throw error;
    }),
  ]);
  return { repository, pulls, issues, commits };
}
