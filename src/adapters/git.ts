import type { Project, GitInfo, GitCommit, GitMr } from '../types';
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

async function fetchGithub(slug: string, token: string | null): Promise<GitInfo> {
  const base = 'https://api.github.com';
  const commonHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    commonHeaders['Authorization'] = `Bearer ${token}`;
  }

  const [commitsResult, prsResult] = await Promise.allSettled([
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

  return { openMrCount, mrs, commits, failedPipelines: null };
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

  const [commitsResult, mrsResult, pipelinesResult] = await Promise.allSettled([
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

  return { openMrCount, mrs, commits, failedPipelines };
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
