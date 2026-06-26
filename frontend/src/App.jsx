import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ReviewForm from './components/ReviewForm';
import ReviewDetail from './components/ReviewDetail';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [view, setView] = useState('dashboard'); // dashboard | form | detail
  const [reviews, setReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      // 1. Fetch DB status
      const statusRes = await fetch(`${API_BASE_URL.replace('/reviews', '')}/status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDbStatus(statusData.database);
      }
      
      // 2. Fetch reviews
      const reviewsRes = await fetch(`${API_BASE_URL}/reviews`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      } else {
        throw new Error('Could not fetch review history.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please verify that the server is running on port 5000.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleCreateReview = async (formData) => {
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate code review.');
      }

      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      setSelectedReviewId(newReview._id);
      setView('detail');
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handlePostReviewComment = async (id, tokens) => {
    const res = await fetch(`${API_BASE_URL}/reviews/${id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokens),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to post review comments.');
    }
    return await res.json();
  };

  const selectedReview = reviews.find((r) => r._id === selectedReviewId);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="app-title-container" style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')}>
          <Bot size={32} className="logo-icon" />
          <div>
            <h1 className="app-title">MR Review Agent</h1>
            <div className="app-subtitle">Automated AI Merge Request Auditor</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {view !== 'dashboard' && (
            <button className="btn btn-secondary" onClick={() => setView('dashboard')}>
              Back to Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Connection Errors */}
      {error && (
        <div className="alert-message alert-danger">
          <span>{error}</span>
          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', marginLeft: 'auto' }} onClick={fetchInitialData}>
            Retry Connection
          </button>
        </div>
      )}

      {!error && (
        <>
          {loadingStatus ? (
            <div className="loader-container">
              <div className="spinner" />
              <p className="text-secondary">Loading Review Logs...</p>
            </div>
          ) : (
            <>
              {view === 'dashboard' && (
                <Dashboard
                  reviews={reviews}
                  dbStatus={dbStatus}
                  onSelectReview={(id) => {
                    setSelectedReviewId(id);
                    setView('detail');
                  }}
                  onCreateNewClick={() => setView('form')}
                />
              )}

              {view === 'form' && (
                <ReviewForm
                  onSubmit={handleCreateReview}
                  onBack={() => setView('dashboard')}
                  loading={formLoading}
                />
              )}

              {view === 'detail' && selectedReview && (
                <ReviewDetail
                  review={selectedReview}
                  onBack={() => setView('dashboard')}
                  onPostComment={handlePostReviewComment}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
