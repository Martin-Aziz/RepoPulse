export interface GitHubRepository {
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  draft: boolean;
  user: { login: string } | null;
}

export interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  pull_request?: unknown;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { date: string | null } | null;
  };
}

export interface PageResult<T> {
  items: T[];
  truncated: boolean;
}

export interface RepositoryData {
  repository: GitHubRepository;
  pulls: PageResult<GitHubPullRequest>;
  issues: PageResult<GitHubIssue>;
  commits: GitHubCommit[];
}

export interface PullRequestInsight {
  number: number;
  title: string;
  url: string;
  author: string;
  ageDays: number;
  draft: boolean;
}

export interface IssueInsight {
  number: number;
  title: string;
  url: string;
}

export interface RepositoryReport {
  generatedAt: string;
  repository: {
    fullName: string;
    url: string;
    description: string | null;
    defaultBranch: string;
    stars: number;
    forks: number;
  };
  metrics: {
    openPullRequests: number;
    stalePullRequests: number;
    openIssues: number;
    recentCommitsSampled: number;
  };
  oldestPullRequests: PullRequestInsight[];
  recentIssues: IssueInsight[];
  warnings: string[];
}
