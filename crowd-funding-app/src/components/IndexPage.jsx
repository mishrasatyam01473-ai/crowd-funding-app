import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./IndexPage.css";

const IndexPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDonate = (campaign) => {
    navigate("/donate", {
      state: {
        creatorName: campaign.creator || campaign.creatorName || "",
        campaignName: campaign.title || campaign.campaignName || "",
        description: campaign.description || "",
        campaignId: campaign._id || campaign.campaignId || "",
      },
    });
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/campaigns`);
        if (!response.ok) {
          throw new Error("Failed to fetch campaigns from server");
        }
        const data = await response.json();
        setCampaigns(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (location.hash === "#about") {
      setTimeout(() => {
        const el = document.getElementById("about");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  }, [location.hash]);

  return (
    <div className="index-container">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Fund the Future.</h1>
          <p className="hero-subtitle">
            Join a global community of backers helping creators bring their boldest ideas to life.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("/create-programme")}>
              Start a Campaign
            </button>
            <button className="btn-secondary" onClick={() => navigate("/donation-history")}>
              My Donations
            </button>
          </div>
        </div>
      </header>

      <section id="featured-projects" className="dynamic-section">
        <div className="section-header">
          <h2>Featured Projects</h2>
        </div>

        {isLoading && <div className="loading-state">Loading live projects...</div>}
        {error && <div className="error-state">Error: {error}</div>}

        {!isLoading && !error && (
          <div className="campaign-grid">
            {campaigns.length === 0 ? (
              <p>No campaigns found.</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign._id} className="campaign-card">
                  <div className="campaign-details">
                    <h3 className="campaign-title">{campaign.title}</h3>
                    <p className="campaign-description">{campaign.description}</p>
                    <p className="campaign-creator">by {campaign.creator}</p>

                    <div className="campaign-stats">
                      <div className="stat">
                        <span className="stat-value">₹{(campaign.goal || 0).toLocaleString()}</span>
                        <span className="stat-label">goal</span>
                      </div>
                    </div>

                    <button
                      className="btn-donate-card"
                      onClick={() => handleDonate(campaign)}
                      title={`Support ${campaign.title}`}
                    >
                      <svg className="donate-heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>Donate Now</span>
                      <svg className="donate-arrow-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-header">
            <span className="about-badge">About Crowd-Fund</span>
            <h2 className="about-title">Empowering Communities, One Cause at a Time</h2>
            <p className="about-subtitle">
              Crowd-Fund is an open, verified platform created to provide rapid, transparent assistance to people in urgent need—from emergency medical care and disaster relief to education and community causes.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon-box emergency">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>Emergency & Medical Aid</h3>
              <p>
                Fast-track financial mobilization for patients, disaster relief, and communities facing sudden emergency distress.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon-box shield">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>100% Verified Causes</h3>
              <p>
                Every campaign is reviewed and vetted to ensure transparency, donor security, and genuine project integrity.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon-box zap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3>Instant Transparent Checkout</h3>
              <p>
                Powered by secure Razorpay payment processing with automated receipts and verifiable records stored in our ledger.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon-box heart">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3>Supporter-Driven Impact</h3>
              <p>
                Track your personal donation history anytime and witness tangible changes powered by your direct support.
              </p>
            </div>
          </div>

          <div className="about-stats-strip">
            <div className="about-stat-item">
              <span className="about-stat-num">100%</span>
              <span className="about-stat-label">Verified Campaigns</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-num">₹0</span>
              <span className="about-stat-label">Hidden Platform Fees</span>
            </div>
            <div className="about-stat-item">
              <span className="about-stat-num">24/7</span>
              <span className="about-stat-label">Supporter Query Assistance</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IndexPage;