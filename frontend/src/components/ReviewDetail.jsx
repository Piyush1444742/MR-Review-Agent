import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Code, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function ReviewDetail({ review, onBack, onPostComment }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [postStatus, setPostStatus] = useState('idle'); // idle | loading | success | error
  const [copiedId, setCopiedId] = useState(null);
  const [customGithubToken, setCustomGithubToken] = useState('');
  const [customGitlabToken, setCustomGitlabToken] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const getSeverityBadgeClass = (severity) => {
    if (severity === 'Critical') return 'badge-critical';
    if (severity === 'Warning') return 'badge-warning';
    return 'badge-suggestion';
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Security': return 'badge-sec';
      case 'Bug': return 'badge-bug';
      case 'Performance': return 'badge-perf';
      default: return 'badge-style';
    }
  };

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublishClick = () => {
    setShowTokenPrompt(true);
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    setPostStatus('loading');
    try {
      await onPostComment(review._id, {
        githubToken: customGithubToken || undefined,
        gitlabToken: customGitlabToken || undefined,
      });
      setPostStatus('success');
      setShowTokenPrompt(false);
      setTimeout(() => setPostStatus('idle'), 4000);
    } catch (err) {
      setPostStatus('error');
    }
  };

  return (
    <div className="flex-column animate-fade-in">
      {/* Detail Header Header */}
      <div className="glass-card flex-row justify-between align-center" style={{ flexWrap: 'wrap', gap: '20px' }}>
        <div className="flex-row gap-12 align-center">
          <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <div className="detail-header">
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff' }}>
              {review.title}
            </h2>
            <div className="detail-meta">
              <span className={`badge badge-${review.platform}`}>
                {review.platform === 'github' ? 'GitHub PR' : 'GitLab MR'}
              </span>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Repo: <b>{review.repoName}</b>
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>•</span>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                MR ID: <b>#{review.mrId}</b>
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>•</span>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Author: <b>@{review.author}</b>
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>•</span>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Branches: <code>{review.sourceBranch}</code> → <code>{review.targetBranch}</code>
              </span>
            </div>
          </div>
        </div>

        <div className="flex-row gap-12 align-center">
          <button className="btn btn-secondary" onClick={() => window.open(review.mrUrl, '_blank')}>
            <ExternalLink size={14} />
            View Original
          </button>
          <button className="btn btn-primary" onClick={handlePublishClick} disabled={postStatus === 'loading'}>
            <Send size={14} />
            Publish Review Comments
          </button>
          <div className={`score-badge ${getScoreClass(review.score)}`}>
            {review.score}
          </div>
        </div>
      </div>

      {/* Publish Token Dialog Overlay */}
      {showTokenPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form className="glass-card flex-column animate-fade-in" onSubmit={handlePublishSubmit} style={{ maxWidth: '440px', width: '90%', gap: '16px', background: '#0e101a' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Publish to Git Host</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
              To post this review summary directly as a comment on {review.platform === 'github' ? 'GitHub' : 'GitLab'}, please enter your access token. Alternatively, if a token is already configured in the server's <code>.env</code> file, you can leave this blank.
            </p>

            <div className="form-group">
              <label className="form-label">
                {review.platform === 'github' ? 'GitHub Personal Access Token (PAT)' : 'GitLab Private Access Token'}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder={review.platform === 'github' ? 'ghp_...' : 'glpat-...'}
                value={review.platform === 'github' ? customGithubToken : customGitlabToken}
                onChange={(e) => {
                  if (review.platform === 'github') setCustomGithubToken(e.target.value);
                  else setCustomGitlabToken(e.target.value);
                }}
              />
            </div>

            <div className="flex-row justify-between mt-12" style={{ gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowTokenPrompt(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Notifications */}
      {postStatus === 'success' && (
        <div className="alert-message alert-success animate-fade-in">
          <CheckCircle size={16} />
          <span>Review summary posted successfully to the {review.platform === 'github' ? 'GitHub Pull Request' : 'GitLab Merge Request'}!</span>
        </div>
      )}
      {postStatus === 'error' && (
        <div className="alert-message alert-danger animate-fade-in">
          <AlertTriangle size={16} />
          <span>Failed to publish review comments. Check API token credentials and retry.</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview Report
        </button>
        <button 
          className={`tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          Detailed Code Findings ({review.findings?.length || 0})
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'overview' ? (
        <div className="flex-column animate-fade-in" style={{ gap: '24px' }}>
          {/* Summary Box */}
          <div className="glass-card flex-column">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Executive Code Summary</h3>
            <p style={{ lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {review.summary}
            </p>
          </div>

          {/* Pros & Cons Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="glass-card flex-column" style={{ borderLeft: '4px solid var(--success)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)' }} /> Key Strengths
              </h3>
              {review.pros && review.pros.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  {review.pros.map((pro, index) => (
                    <li key={index} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {pro}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '8px' }}>No strengths noted.</p>
              )}
            </div>

            <div className="glass-card flex-column" style={{ borderLeft: '4px solid var(--warning)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Code Concerns
              </h3>
              {review.cons && review.cons.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  {review.cons.map((con, index) => (
                    <li key={index} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {con}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '8px' }}>No severe issues highlighted. Code quality looks solid!</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="findings-container animate-fade-in">
          {(!review.findings || review.findings.length === 0) ? (
            <div className="glass-card text-center" style={{ padding: '48px 0' }}>
              <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '12px' }} />
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>No code issues detected. The code score is 100/100!</p>
            </div>
          ) : (
            review.findings.map((finding, idx) => (
              <div key={finding._id || idx} className={`glass-card finding-card ${finding.severity}`}>
                <div className="finding-header">
                  <div className="flex-column" style={{ gap: '6px' }}>
                    <div className="flex-row gap-8 align-center" style={{ flexWrap: 'wrap' }}>
                      <span className="finding-title">{finding.title}</span>
                      <span className={`badge ${getSeverityBadgeClass(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className={`badge ${getCategoryBadgeClass(finding.category)}`}>
                        {finding.category}
                      </span>
                    </div>
                    <span className="finding-path">
                      {finding.file} : Lines {finding.lineStart}-{finding.lineEnd}
                    </span>
                  </div>
                </div>

                <p className="finding-desc">{finding.description}</p>

                {/* Diff Viewer panel */}
                {(finding.currentCode || finding.suggestedCode) && (
                  <div className="code-diff-wrapper">
                    {finding.currentCode && (
                      <div className="code-panel current">
                        <div className="code-panel-header">
                          <span>Current Code</span>
                        </div>
                        <pre className="code-pre"><code>{finding.currentCode}</code></pre>
                      </div>
                    )}
                    
                    {finding.suggestedCode && (
                      <div className="code-panel suggested">
                        <div className="code-panel-header">
                          <span>Suggested Improvement</span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                            onClick={() => handleCopyCode(finding.suggestedCode, idx)}
                          >
                            {copiedId === idx ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                            {copiedId === idx ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="code-pre"><code>{finding.suggestedCode}</code></pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
