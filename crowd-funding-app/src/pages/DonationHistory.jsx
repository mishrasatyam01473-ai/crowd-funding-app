import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { getAuthUser } from "../utils/auth.js";
import "./DonationHistory.css";

const DonationHistory = () => {
  const navigate = useNavigate();

  // Load user synchronously from active session
  const [currentUser] = useState(() => getAuthUser());

  const [donations, setDonations] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch donation history for the authenticated user only
  const fetchDonations = async (emailToQuery) => {
    const targetEmail = emailToQuery || currentUser?.mailid;
    if (!targetEmail) {
      navigate("/user-login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = `${API_BASE_URL}/api/donations?email=${encodeURIComponent(targetEmail.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load donation history.");
      }

      setDonations(data.donations || []);
      setTotalAmount(data.totalAmount || 0);
    } catch (err) {
      console.error("Error fetching donations:", err);
      setError(err.message || "Could not retrieve donation history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/user-login", { replace: true, state: { from: "/donation-history" } });
    } else if (currentUser.mailid) {
      fetchDonations(currentUser.mailid);
    }
  }, [currentUser, navigate]);

  // Filter donations by search query (campaign name, creator, donation ID)
  const filteredDonations = donations.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (d.campaignName && d.campaignName.toLowerCase().includes(q)) ||
      (d.creatorName && d.creatorName.toLowerCase().includes(q)) ||
      (d.donationId && d.donationId.toLowerCase().includes(q)) ||
      (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q))
    );
  });

  // Calculate unique campaigns supported
  const uniqueCampaignsCount = new Set(
    donations.map((d) => d.campaignName || d.campaignId).filter(Boolean)
  ).size;

  // If not logged in, redirect immediately to login
  if (!currentUser) {
    return <Navigate to="/user-login" replace state={{ from: "/donation-history" }} />;
  }

  return (
    <div className="history-page">
      {/* Background ambient lighting */}
      <div className="history-bg-glow glow-1" aria-hidden="true" />
      <div className="history-bg-glow glow-2" aria-hidden="true" />

      <div className="history-container">
        {/* Navigation Breadcrumb */}
        <div className="history-breadcrumb-bar">
          <button
            type="button"
            className="history-back-btn"
            onClick={() => navigate(-1)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>

          <div className="history-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            {currentUser && (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <span className="crumb-sep">/</span>
              </>
            )}
            <span className="crumb-current">Donation History</span>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="history-header">
          <div className="history-badge">
            <span className="badge-pulse" />
            <span>Verified Supporter History</span>
          </div>
          <h1 className="history-title">My Donation History</h1>
          <p className="history-subtitle">
            {currentUser
              ? `Showing contribution records for ${currentUser.mailid}`
              : "Review all your verified contributions, payment methods, and timestamps."}
          </p>
        </div>

        {/* Summary Metrics Bar */}
        <div className="history-stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon-box money">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Amount Donated</span>
              <h2 className="stat-value">₹{Number(totalAmount).toLocaleString("en-IN")}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box count">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Donations Made</span>
              <h2 className="stat-value">{donations.length}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box causes">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Causes Supported</span>
              <h2 className="stat-value">{uniqueCampaignsCount}</h2>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="history-filter-bar">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by campaign name, creator, or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={() => fetchDonations(currentUser?.mailid)}
            title="Refresh list"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Content Section: Loading, Error, Table, or Empty State */}
        {loading ? (
          <div className="history-loading-box">
            <div className="history-spinner" />
            <p>Loading your donation history...</p>
          </div>
        ) : error ? (
          <div className="history-error-card">
            <h3>Unable to load donations</h3>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => fetchDonations(currentUser?.mailid || lookupEmail)}
            >
              Try Again
            </button>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="history-empty-card">
            <div className="empty-icon-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h2>No donation records found</h2>
            <p>
              {searchQuery
                ? `No donations matched "${searchQuery}". Try a different keyword.`
                : "You haven't made any recorded donations yet. Every contribution creates a lasting impact for someone in need."}
            </p>
            <button className="browse-causes-btn" onClick={() => navigate("/")}>
              Explore Campaigns to Support
            </button>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Creator Name</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Method of Payment</th>
                  <th>Status</th>
                  <th>Receipt ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((d, idx) => (
                  <tr key={d.donationId || idx}>
                    <td className="campaign-name-cell">
                      <div className="cell-flex">
                        <span className="campaign-dot" />
                        <div>
                          <strong className="campaign-title-text">
                            {d.campaignName || "Community Cause"}
                          </strong>
                          {d.description && (
                            <span className="campaign-desc-sub">
                              {d.description.length > 50
                                ? `${d.description.slice(0, 50)}...`
                                : d.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="creator-cell">
                      <span className="creator-pill">
                        {d.creatorName || "Verified Creator"}
                      </span>
                    </td>

                    <td className="amount-cell">
                      <span className="amount-badge">
                        ₹{Number(d.amount).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="date-cell">
                      <span className="date-text">
                        {d.donationDate ||
                          (d.createdAt
                            ? new Date(d.createdAt).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Recently")}
                      </span>
                    </td>

                    <td className="method-cell">
                      <span className="payment-method-tag">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          style={{ marginRight: "6px" }}
                        >
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        {d.paymentMethod || "Razorpay (Online)"}
                      </span>
                    </td>

                    <td className="status-cell">
                      <span className="status-verified-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {d.paymentStatus || "SUCCESS"}
                      </span>
                    </td>

                    <td className="receipt-cell">
                      <code className="receipt-code">
                        {d.donationId || `DON-${idx}`}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationHistory;
