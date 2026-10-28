import assert from "node:assert/strict";
import test from "node:test";
import { GitHubApiError, GitHubClient, fetchRepositoryData } from "../src/github.ts";

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("paginates results and supplies authentication via headers only", async () => {
  const urls: string[] = [];
  const auth: string[] = [];
  const fetcher = (async (input: URL | RequestInfo, init?: RequestInit) => {
    urls.push(String(input));
    auth.push(new Headers(init?.headers).get("Authorization") ?? "");
    const page = new URL(String(input)).searchParams.get("page");
    return response(page === "1" ? Array.from({ length: 100 }, (_, i) => i) : [100]);
  }) as typeof fetch;
  const client = new GitHubClient(fetcher, "dummy-test-token");
  const result = await client.list<number>("/repos/octocat/example/issues?state=open");
  assert.equal(result.items.length, 101);
  assert.equal(result.truncated, false);
  assert.equal(urls.length, 2);
  assert.ok(urls.every((url) => !url.includes("dummy-test-token")));
  assert.deepEqual(auth, ["Bearer dummy-test-token", "Bearer dummy-test-token"]);
});

test("stops pagination after the documented safety limit", async () => {
  let count = 0;
  const fetcher = (async () => {
    count += 1;
    return response(Array.from({ length: 100 }, (_, i) => i));
  }) as typeof fetch;
  const result = await new GitHubClient(fetcher).list<number>("/repos/o/r/pulls");
  assert.equal(count, 10);
  assert.equal(result.items.length, 1000);
  assert.equal(result.truncated, true);
});

test("surfaces actionable API errors", async () => {
  const fetcher = (async () => response({ message: "rate limit exceeded" }, 403)) as typeof fetch;
  await assert.rejects(
    new GitHubClient(fetcher).get("/repos/o/r"),
    (error: unknown) => error instanceof GitHubApiError &&
      error.status === 403 && /GH_TOKEN/.test(error.message),
  );
});

test("treats GitHub's empty-repository commits response as zero commits", async () => {
  const fetcher = (async (input: URL | RequestInfo) => {
    const url = String(input);
    if (url.includes("/commits?")) return response({ message: "empty" }, 409);
    if (url.includes("/pulls?") || url.includes("/issues?")) return response([]);
    return response({
      full_name: "o/r",
      html_url: "https://github.com/o/r",
      description: null,
      default_branch: "main",
      stargazers_count: 0,
      forks_count: 0,
    });
  }) as typeof fetch;
  const data = await fetchRepositoryData("o", "r", new GitHubClient(fetcher));
  assert.deepEqual(data.commits, []);
});
