import axios from 'axios';

// Parse GitLab Merge Request URL
// E.g., https://gitlab.com/gitlab-org/gitlab/-/merge_requests/12345
export const parseGitLabUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('gitlab.com')) return null;

    // Split pathname to extract project path and MR ID
    // Path looks like: /owner/repo/-/merge_requests/number
    // or /owner/subgroup/repo/-/merge_requests/number
    const parts = parsed.pathname.split('/').filter(Boolean);
    const mrIndex = parts.indexOf('merge_requests');

    if (mrIndex !== -1 && mrIndex < parts.length - 1) {
      // Everything before '-' or 'merge_requests' is the project path
      const projectParts = parts.slice(0, mrIndex).filter(p => p !== '-');
      const projectPath = projectParts.join('/');
      const mrIid = parts[mrIndex + 1];

      return {
        projectPath,
        projectPathEncoded: encodeURIComponent(projectPath),
        mrIid,
      };
    }
  } catch (error) {
    return null;
  }
  return null;
};

// Fetch MR Details and Diffs from GitLab
export const fetchGitLabMRDetails = async (url, token) => {
  const parsed = parseGitLabUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitLab MR URL. Format should be: https://gitlab.com/owner/repo/-/merge_requests/number');
  }

  const { projectPath, projectPathEncoded, mrIid } = parsed;
  const gitlabToken = token || process.env.GITLAB_TOKEN;

  const headers = {};
  if (gitlabToken) {
    headers['PRIVATE-TOKEN'] = gitlabToken;
  }

  try {
    const baseUrl = `https://gitlab.com/api/v4/projects/${projectPathEncoded}/merge_requests/${mrIid}`;

    // 1. Fetch MR Metadata and Changes combined
    // GitLab changes endpoint returns metadata and the diffs!
    const changesUrl = `${baseUrl}/changes`;
    const response = await axios.get(changesUrl, { headers });
    const mrData = response.data;

    // Convert gitlab files diff into a readable unified format for the LLM
    let combinedDiff = '';
    if (mrData.changes && mrData.changes.length > 0) {
      combinedDiff = mrData.changes
        .map((change) => {
          const header = `--- a/${change.old_path}\n+++ b/${change.new_path}\n`;
          return `${header}${change.diff}`;
        })
        .join('\n\n');
    }

    return {
      repoName: projectPath,
      mrId: mrIid,
      title: mrData.title,
      sourceBranch: mrData.source_branch || 'unknown',
      targetBranch: mrData.target_branch || 'unknown',
      author: mrData.author?.username || 'unknown',
      platform: 'gitlab',
      diff: combinedDiff,
      mrUrl: url,
    };
  } catch (error) {
    console.error('GitLab API error:', error.response?.data || error.message);
    const message = error.response?.data?.message || error.message;
    throw new Error(`Failed to fetch MR from GitLab: ${message}`);
  }
};

// Post review comment on GitLab MR
export const postGitLabComment = async (url, token, commentBody) => {
  const parsed = parseGitLabUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitLab MR URL');
  }
  const { projectPathEncoded, mrIid } = parsed;
  const gitlabToken = token || process.env.GITLAB_TOKEN;

  if (!gitlabToken) {
    throw new Error('GitLab Private Token is required to post comments.');
  }

  const commentUrl = `https://gitlab.com/api/v4/projects/${projectPathEncoded}/merge_requests/${mrIid}/notes`;
  await axios.post(
    commentUrl,
    { body: commentBody },
    {
      headers: {
        'PRIVATE-TOKEN': gitlabToken,
      },
    }
  );
};
