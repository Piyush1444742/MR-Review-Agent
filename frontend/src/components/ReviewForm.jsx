import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play, ArrowLeft, Key, Settings, HelpCircle } from 'lucide-react';

export default function ReviewForm({ onSubmit, onBack, loading }) {
  const [mrUrl, setMrUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [gitlabToken, setGitlabToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!mrUrl.trim()) {
      setError('Please provide a Merge Request or Pull Request URL.');
      return;
    }

    if (!mrUrl.includes('github.com') && !mrUrl.includes('gitlab.com')) {
      setError('Invalid URL. Only GitHub and GitLab Pull/Merge Request URLs are supported.');
      return;
    }

    onSubmit({
      mrUrl: mrUrl.trim(),
      geminiApiKey: geminiApiKey.trim() || undefined,
      githubToken: githubToken.trim() || undefined,
      gitlabToken: gitlabToken.trim() || undefined,
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <div className="flex-row gap-12 align-center" style={{ marginBottom: '24px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={onBack} disabled={loading}>
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Start AI Code Review</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="mr-url">
            Merge Request / Pull Request URL
          </label>
          <input
            id="mr-url"
            type="text"
            className="form-input"
            placeholder="https://github.com/owner/repo/pull/12 or https://gitlab.com/.../-/merge_requests/1"
            value={mrUrl}
            onChange={(e) => setMrUrl(e.target.value)}
            disabled={loading}
          />
          <span className="text-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} /> Supports GitHub and GitLab public repositories out-of-the-box.
          </span>
        </div>

        {/* Collapsible Advanced Credentials Accordion */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
          <div className="accordion-header" onClick={() => setShowAdvanced(!showAdvanced)}>
            <span className="flex-row gap-8 align-center" style={{ fontWeight: 600 }}>
              <Settings size={14} /> Advanced Credentials & Keys (Optional)
            </span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {showAdvanced && (
            <div className="flex-column mt-12 animate-fade-in" style={{ gap: '14px', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="gemini-key">
                  <span className="flex-row gap-8 align-center"><Key size={12} /> Gemini API Key Override</span>
                </label>
                <input
                  id="gemini-key"
                  type="password"
                  className="form-input"
                  placeholder="Paste your Gemini API key (leaves env key active if blank)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="github-token">
                  GitHub Personal Access Token
                </label>
                <input
                  id="github-token"
                  type="password"
                  className="form-input"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gitlab-token">
                  GitLab Private Token
                </label>
                <input
                  id="gitlab-token"
                  type="password"
                  className="form-input"
                  placeholder="glpat-..."
                  value={gitlabToken}
                  onChange={(e) => setGitlabToken(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="alert-message alert-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-12"
          style={{ width: '100%', height: '48px', fontSize: '1rem' }}
          disabled={loading}
        >
          {loading ? (
            <span className="flex-row gap-8 align-center">
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              Agent Analyzing Code Diffs...
            </span>
          ) : (
            <span className="flex-row gap-8 align-center">
              <Play size={16} />
              Trigger AI Review
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
