import axios from 'axios';

// Parse GitHub Pull Request URL
// E.g., https://github.com/octocat/Spoon-Knife/pull/1234
export const parseGitHubUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('github.com')) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    // Path looks like: /owner/repo/pull/number
    if (parts.length >= 4 && parts[2] === 'pull') {
      return {
        owner: parts[0],
        repo: parts[1],
        pullNumber: parts[3],
      };
    }
  } catch (error) {
    return null;
  }
  return null;
};

// Fetch PR Details and Diffs from GitHub
export const fetchGitHubPRDetails = async (url, token) => {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub PR URL. Format should be: https://github.com/owner/repo/pull/number');
  }

  const { owner, repo, pullNumber } = parsed;
  const githubToken = token || process.env.GITHUB_TOKEN;

  const headers = {
    Accept: 'application/vnd.github+json',
  };
  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  try {
    // 1. Fetch PR Metadata
    const metadataUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;
    const metaResponse = await axios.get(metadataUrl, { headers });
    const prData = metaResponse.data;

    // 2. Fetch PR Diff text
    // Using Accept header: 'application/vnd.github.diff' retrieves the raw diff text
    const diffHeaders = {
      ...headers,
      Accept: 'application/vnd.github.diff',
    };
    const diffResponse = await axios.get(metadataUrl, {
      headers: diffHeaders,
      responseType: 'text',
    });

    return {
      repoName: `${owner}/${repo}`,
      mrId: pullNumber,
      title: prData.title,
      sourceBranch: prData.head?.ref || 'unknown',
      targetBranch: prData.base?.ref || 'unknown',
      author: prData.user?.login || 'unknown',
      platform: 'github',
      diff: diffResponse.data,
      mrUrl: url,
    };
  } catch (error) {
    console.error('GitHub API error:', error.response?.data || error.message);
    const message = error.response?.data?.message || error.message;
    throw new Error(`Failed to fetch PR from GitHub: ${message}`);
  }
};

// Post review comment on GitHub PR
export const postGitHubComment = async (url, token, commentBody) => {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub PR URL');
  }
  const { owner, repo, pullNumber } = parsed;
  const githubToken = token || process.env.GITHUB_TOKEN;

  if (!githubToken) {
    throw new Error('GitHub Personal Access Token is required to post comments.');
  }

  const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`;
  await axios.post(
    commentUrl,
    { body: commentBody },
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${githubToken}`,
      },
    }
  );
};
