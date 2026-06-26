import { fetchGitHubPRDetails, postGitHubComment } from '../services/githubService.js';
import { fetchGitLabMRDetails, postGitLabComment } from '../services/gitlabService.js';
import { analyzeDiffWithGemini } from '../services/geminiService.js';
import { Review } from '../models/Review.js';

// Analyze a new MR/PR
export const createReview = async (req, res) => {
  const { mrUrl, githubToken, gitlabToken, geminiApiKey } = req.body;

  if (!mrUrl) {
    return res.status(400).json({ error: 'mrUrl is required' });
  }

  try {
    let prDetails;
    if (mrUrl.includes('github.com')) {
      prDetails = await fetchGitHubPRDetails(mrUrl, githubToken);
    } else if (mrUrl.includes('gitlab.com')) {
      prDetails = await fetchGitLabMRDetails(mrUrl, gitlabToken);
    } else {
      return res.status(400).json({ error: 'Unsupported URL. Only GitHub and GitLab URLs are supported.' });
    }

    if (!prDetails.diff || prDetails.diff.trim() === '') {
      // Create a default clean review
      const reviewRecord = await Review.create({
        repoName: prDetails.repoName,
        mrId: prDetails.mrId,
        title: prDetails.title,
        sourceBranch: prDetails.sourceBranch,
        targetBranch: prDetails.targetBranch,
        author: prDetails.author,
        platform: prDetails.platform,
        score: 100,
        summary: 'No code changes detected in this Merge Request.',
        pros: ['No modifications introduced'],
        cons: [],
        findings: [],
        mrUrl: prDetails.mrUrl,
      });
      return res.status(201).json(reviewRecord);
    }

    // Call Gemini API to review
    console.log(`Analyzing diff for MR: "${prDetails.title}" using Gemini...`);
    const aiReport = await analyzeDiffWithGemini(prDetails.diff, prDetails.title, geminiApiKey);

    // Save to DB
    const reviewRecord = await Review.create({
      repoName: prDetails.repoName,
      mrId: prDetails.mrId,
      title: prDetails.title,
      sourceBranch: prDetails.sourceBranch,
      targetBranch: prDetails.targetBranch,
      author: prDetails.author,
      platform: prDetails.platform,
      score: aiReport.score,
      summary: aiReport.summary,
      pros: aiReport.pros,
      cons: aiReport.cons,
      findings: aiReport.findings,
      mrUrl: prDetails.mrUrl,
    });

    console.log(`Review successfully created with ID: ${reviewRecord._id}`);
    res.status(201).json(reviewRecord);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get list of all reviews
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get details of a single review
export const getReviewById = async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    console.error('Error fetching review details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Post the review feedback to the MR as a comment
export const postReviewComment = async (req, res) => {
  const { id } = req.params;
  const { githubToken, gitlabToken } = req.body;

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Format review data into a clean markdown comment
    let commentMarkdown = `## 🤖 AI Code Review Summary\n\n`;
    commentMarkdown += `**Overall Code Quality Score:** \`${review.score}/100\`\n\n`;
    commentMarkdown += `### 📝 Summary\n${review.summary}\n\n`;

    if (review.pros && review.pros.length > 0) {
      commentMarkdown += `### 👍 Key Strengths\n`;
      review.pros.forEach(pro => {
        commentMarkdown += `- ${pro}\n`;
      });
      commentMarkdown += `\n`;
    }

    if (review.cons && review.cons.length > 0) {
      commentMarkdown += `### ⚠️ Key Concerns\n`;
      review.cons.forEach(con => {
        commentMarkdown += `- ${con}\n`;
      });
      commentMarkdown += `\n`;
    }

    if (review.findings && review.findings.length > 0) {
      commentMarkdown += `<details>\n<summary><b>🔍 Detailed Analysis (${review.findings.length} findings)</b></summary>\n\n`;
      commentMarkdown += `### Detailed Findings\n\n`;

      review.findings.forEach((finding, idx) => {
        commentMarkdown += `#### ${idx + 1}. [${finding.severity}] ${finding.title}\n`;
        commentMarkdown += `- **File:** \`${finding.file}\` (Lines ${finding.lineStart}-${finding.lineEnd})\n`;
        commentMarkdown += `- **Category:** \`${finding.category}\`\n`;
        commentMarkdown += `- **Description:** ${finding.description}\n\n`;

        if (finding.currentCode) {
          commentMarkdown += `**Current Code:**\n\`\`\`\n${finding.currentCode}\n\`\`\`\n`;
        }
        if (finding.suggestedCode) {
          commentMarkdown += `**Suggested Improvement:**\n\`\`\`\n${finding.suggestedCode}\n\`\`\`\n`;
        }
        commentMarkdown += `---\n\n`;
      });

      commentMarkdown += `</details>\n`;
    }

    commentMarkdown += `\n*Reviewed by MR-Review-Agent using Gemini AI. (Score: ${review.score}/100)*`;

    // Send comment to specific API
    if (review.platform === 'github') {
      await postGitHubComment(review.mrUrl, githubToken, commentMarkdown);
    } else if (review.platform === 'gitlab') {
      await postGitLabComment(review.mrUrl, gitlabToken, commentMarkdown);
    }

    res.status(200).json({ message: 'Review comment posted successfully to Git host.' });
  } catch (error) {
    console.error('Error posting review comment:', error);
    res.status(500).json({ error: error.message });
  }
};
