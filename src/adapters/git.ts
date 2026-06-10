import type { Project, GitInfo, GitCommit, GitMr, GitBranch } from '../types';
import { httpRequest, parseJson } from '../lib/http';
import { getSecret, secretKeys } from '../lib/secrets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function repoSlugFromUrl(repoUrl: string): string {
  // Strip protocol, host, leading slash, and trailing .git
  // e.g. https://github.com/owner/repo.git -> owner/repo
  try {
    const u = new URL(repoUrl);
    return u.pathname.replace(/^\//, '').replace(/\.git$/, '');
  } catch {
    return repoUrl.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
  }
}

function gitlabHostFromUrl(repoUrl: string): string {
  if (repoUrl.startsWith('http')) {
    try {
      const u = new URL(repoUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      // fall through
    }
  }
  return 'https://gitlab.com';
}

function hintForStatus(status: number, provider: string): string {
  if (status === 401 || status === 403) {
    return `${provider} ${status} — check token permissions`;
  }
  if (status === 404) {
    return `${provider} 404 — check repo slug or token`;
  }
  return `${provider} ${status}`;
}

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

interface GithubCommitRaw {
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date?: string };
  };
  author?: { login?: string };
}

interface GithubPrRaw {
  title: string;
  html_url: string;
  updated_at: string;
  user?: { login?: string };
}

interface GithubBranchRaw {
  name: string;
}

interface GithubRepoRaw {
  default_branch?: string;
}

async function fetchGithub(slug: string, token: string | null): Promise<GitInfo> {
  const base = 'https://api.github.com';
  const commonHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    commonHeaders['Authorization'] = `Bearer ${token}`;
  }

  const [commitsResult, prsResult, branchesResult, repoResult] = await Promise.allSettled([
    httpRequest({
      method: 'GET',
      url: `${base}/repos/${slug}/commits?per_page=5`,
      headers: commonHeaders,
      timeoutMs: 10_000,
    }),
    httpRequest({
      method: 'GET',
      url: `${base}/repos/${slug}/pulls?state=open&per_page=20`,
      headers: commonHeaders,
      timeoutMs: 10_000,
    }),
    httpRequest({
      method: 'GET',
      url: `${base}/repos/${slug}/branches?per_page=100`,
      headers: commonHeaders,
      timeoutMs: 10_000,
    }),
    httpRequest({
      method: 'GET',
      url: `${base}/repos/${slug}`,
      headers: commonHeaders,
      timeoutMs: 10_000,
    }),
  ]);

  const allFailed =
    commitsResult.status === 'rejected' && prsResult.status === 'rejected';
  if (allFailed) {
    const msg =
      commitsResult.status === 'rejected'
        ? String(commitsResult.reason)
        : String(prsResult.reason);
    throw new Error(msg);
  }

  let commits: GitCommit[] = [];
  if (commitsResult.status === 'fulfilled') {
    const r = commitsResult.value;
    if (!r.ok) {
      throw new Error(hintForStatus(r.status, 'GitHub'));
    }
    const raw = parseJson<GithubCommitRaw[]>(r) ?? [];
    commits = raw.map((c) => ({
      message: c.commit.message.split('\n')[0],
      author: c.commit.author?.name ?? c.author?.login ?? 'unknown',
      date: c.commit.author?.date ?? '',
      webUrl: c.html_url,
    }));
  }

  let openMrCount = 0;
  let mrs: GitMr[] = [];
  if (prsResult.status === 'fulfilled') {
    const r = prsResult.value;
    if (!r.ok) {
      throw new Error(hintForStatus(r.status, 'GitHub'));
    }
    const raw = parseJson<GithubPrRaw[]>(r) ?? [];
    openMrCount = raw.length;
    mrs = raw.slice(0, 5).map((pr) => ({
      title: pr.title,
      author: pr.user?.login ?? '',
      webUrl: pr.html_url,
      updatedAt: pr.updated_at,
    }));
  }

  let defaultBranch = '';
  if (repoResult.status === 'fulfilled' && repoResult.value.ok) {
    defaultBranch = parseJson<GithubRepoRaw>(repoResult.value)?.default_branch ?? '';
  }

  let branches: GitBranch[] = [];
  if (branchesResult.status === 'fulfilled' && branchesResult.value.ok) {
    const raw = parseJson<GithubBranchRaw[]>(branchesResult.value) ?? [];
    branches = raw.map((b) => ({
      name: b.name,
      default: b.name === defaultBranch,
      lastActivity: null, // GitHub branches API has no commit dates without extra requests
      webUrl: `https://github.com/${slug}/tree/${encodeURIComponent(b.name)}`,
    }));
    // Default branch first, then alphabetical
    branches.sort((a, b) => Number(b.default) - Number(a.default) || a.name.localeCompare(b.name));
  }

  return { openMrCount, mrs, commits, branches, failedPipelines: null };
}

// ---------------------------------------------------------------------------
// GitLab
// ---------------------------------------------------------------------------

interface GitlabCommitRaw {
  title: string;
  author_name: string;
  created_at: string;
  web_url: string;
}

interface GitlabMrRaw {
  title: string;
  web_url: string;
  updated_at: string;
  author?: { username?: string };
}

interface GitlabPipelineRaw {
  status: string;
}

interface GitlabBranchRaw {
  name: string;
  default?: boolean;
  commit?: { committed_date?: string; web_url?: string };
}

async function fetchGitlab(
  host: string,
  projectId: string,
  token: string | null,
): Promise<GitInfo> {
  const encodedId = encodeURIComponent(projectId);
  const base = `${host}/api/v4/projects/${encodedId}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers['PRIVATE-TOKEN'] = token;
  }

  const [commitsResult, mrsResult, pipelinesResult, branchesResult] = await Promise.allSettled([
    httpRequest({
      method: 'GET',
      url: `${base}/repository/commits?per_page=5`,
      headers,
      timeoutMs: 10_000,
    }),
    httpRequest({
      method: 'GET',
      url: `${base}/merge_requests?state=opened&per_page=20`,
      headers,
      timeoutMs: 10_000,
    }),
    httpRequest({
      method: 'GET',
      url: `${base}/pipelines?per_page=10`,
      headers,
      timeoutMs: 10_000,
    }),
    httpRequest({
      method: 'GET',
      url: `${base}/repository/branches?per_page=100`,
      headers,
      timeoutMs: 10_000,
    }),
  ]);

  const allFailed =
    commitsResult.status === 'rejected' &&
    mrsResult.status === 'rejected' &&
    pipelinesResult.status === 'rejected';

  if (allFailed) {
    const firstError =
      commitsResult.status === 'rejected'
        ? String(commitsResult.reason)
        : mrsResult.status === 'rejected'
          ? String(mrsResult.reason)
          : String((pipelinesResult as PromiseRejectedResult).reason);
    throw new Error(firstError);
  }

  let commits: GitCommit[] = [];
  if (commitsResult.status === 'fulfilled') {
    const r = commitsResult.value;
    if (!r.ok) {
      throw new Error(hintForStatus(r.status, 'GitLab'));
    }
    const raw = parseJson<GitlabCommitRaw[]>(r) ?? [];
    commits = raw.map((c) => ({
      message: c.title,
      author: c.author_name,
      date: c.created_at,
      webUrl: c.web_url,
    }));
  }

  let openMrCount = 0;
  let mrs: GitMr[] = [];
  if (mrsResult.status === 'fulfilled') {
    const r = mrsResult.value;
    if (!r.ok) {
      throw new Error(hintForStatus(r.status, 'GitLab'));
    }
    const raw = parseJson<GitlabMrRaw[]>(r) ?? [];
    openMrCount = raw.length;
    mrs = raw.slice(0, 5).map((mr) => ({
      title: mr.title,
      author: mr.author?.username ?? '',
      webUrl: mr.web_url,
      updatedAt: mr.updated_at,
    }));
  }

  let failedPipelines: number | null = null;
  if (pipelinesResult.status === 'fulfilled') {
    const r = pipelinesResult.value;
    if (r.ok) {
      const raw = parseJson<GitlabPipelineRaw[]>(r) ?? [];
      failedPipelines = raw.filter((pl) => pl.status === 'failed').length;
    }
  }

  let branches: GitBranch[] = [];
  if (branchesResult.status === 'fulfilled' && branchesResult.value.ok) {
    const raw = parseJson<GitlabBranchRaw[]>(branchesResult.value) ?? [];
    branches = raw.map((b) => ({
      name: b.name,
      default: b.default ?? false,
      lastActivity: b.commit?.committed_date ?? null,
      // The branches API has no branch URL; derive it from the commit URL
      webUrl: b.commit?.web_url
        ? b.commit.web_url.replace(/\/-\/commit\/.*$/, `/-/tree/${encodeURIComponent(b.name)}`)
        : null,
    }));
    branches.sort((a, b) => {
      if (a.default !== b.default) return Number(b.default) - Number(a.default);
      return (b.lastActivity ?? '').localeCompare(a.lastActivity ?? '');
    });
  }

  return { openMrCount, mrs, commits, branches, failedPipelines };
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export async function fetchGitInfo(p: Project): Promise<GitInfo | null> {
  if (p.gitProvider === 'none') {
    return null;
  }

  const hasRepoInfo =
    (p.gitProjectId && p.gitProjectId.trim() !== '') ||
    (p.repoUrl && p.repoUrl.trim() !== '');
  if (!hasRepoInfo) {
    return null;
  }

  const token = await getSecret(secretKeys.gitToken(p.id));

  if (p.gitProvider === 'github') {
    const slug =
      p.gitProjectId && p.gitProjectId.includes('/')
        ? p.gitProjectId
        : repoSlugFromUrl(p.repoUrl);
    return fetchGithub(slug, token);
  }

  // gitlab
  const host = gitlabHostFromUrl(p.repoUrl);
  const projectId =
    p.gitProjectId && p.gitProjectId.trim() !== '' ? p.gitProjectId : repoSlugFromUrl(p.repoUrl);
  return fetchGitlab(host, projectId, token);
}
