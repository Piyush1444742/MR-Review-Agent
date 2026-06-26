import React from 'react';
import { 
  GitPullRequest, 
  Award, 
  ShieldAlert, 
  ThumbsUp, 
  ChevronRight,
  Database,
  Plus
} from 'lucide-react';

export default function Dashboard({ reviews, onSelectReview, onCreateNewClick, dbStatus }) {
  const totalReviews = reviews.length;
  const avgScore = totalReviews > 0 
    ? Math.round(reviews.reduce((acc, curr) => acc + curr.score, 0) / totalReviews) 
    : 100;
  
  let totalCritical = 0;
  
  reviews.forEach(review => {
    review.findings?.forEach(finding => {
      if (finding.severity === 'Critical') totalCritical++;
    });
  });

  const getScoreClass = (score) => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  return (
    <div className="flex-column animate-fade-in">
      {/* Top Metrics Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper primary">
            <Award size={24} />
          </div>
          <div>
            <div className="metric-value">{totalReviews > 0 ? `${avgScore}/100` : 'N/A'}</div>
            <div className="metric-label">Average Code Score</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper secondary">
            <GitPullRequest size={24} />
          </div>
          <div>
            <div className="metric-value">{totalReviews}</div>
            <div className="metric-label">Total Reviewed MRs</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper success">
            <ThumbsUp size={24} />
          </div>
          <div>
            <div className="metric-value">{totalReviews > 0 ? reviews.filter(r => r.score >= 80).length : 0}</div>
            <div className="metric-label">High Quality MRs</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="metric-value">{totalCritical}</div>
            <div className="metric-label">Critical Issues Found</div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="glass-card flex-column">
        <div className="flex-row justify-between align-center">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Review History</h2>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
              Past repository analysis and agent feedback logs
            </p>
          </div>
          <button className="btn btn-primary" onClick={onCreateNewClick}>
            <Plus size={16} />
            Analyze New MR
          </button>
        </div>

        {totalReviews === 0 ? (
          <div className="text-center" style={{ padding: '48px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', margin: '12px 0' }}>
            <p className="text-secondary" style={{ fontSize: '0.95rem' }}>No merge requests analyzed yet.</p>
            <button className="btn btn-secondary mt-12" onClick={onCreateNewClick}>
              Get Started
            </button>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Repository</th>
                  <th>Merge Request / Pull Request</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id} className="history-row" onClick={() => onSelectReview(review._id)}>
                    <td>
                      <span className={`badge badge-${review.platform}`}>
                        {review.platform === 'github' ? 'GitHub' : 'GitLab'}
                      </span>
                    </td>
                    <td className="history-repo-cell">{review.repoName}</td>
                    <td className="history-title-cell">
                      <div style={{ fontWeight: 600 }}>{review.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        #{review.mrId} by {review.author}
                      </div>
                    </td>
                    <td>
                      <span className={`history-score-cell ${getScoreClass(review.score)}`}>
                        {review.score}/100
                      </span>
                    </td>
                    <td className="text-secondary" style={{ fontSize: '0.8rem' }}>
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="text-muted">
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database connection footer status */}
      {dbStatus && (
        <div className="flex-row justify-between align-center" style={{ padding: '0 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div className="flex-row gap-8">
            <Database size={14} />
            <span>Database Mode: <b>{dbStatus.type}</b></span>
          </div>
          {dbStatus.connected ? (
            <span style={{ color: 'var(--success)' }}>● MongoDB Connected</span>
          ) : (
            <span style={{ color: 'var(--warning)' }}>⚠️ Local Storage Fallback Mode (JSON Database)</span>
          )}
        </div>
      )}
    </div>
  );
}
