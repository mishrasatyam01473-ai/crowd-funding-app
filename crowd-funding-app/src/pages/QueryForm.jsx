import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./QueryForm.css";

const QUERY_CATEGORIES = [
  "General Inquiry",
  "Campaign Support",
  "Donation & Payment",
  "Report an Issue",
  "Partnership & Press",
];

const QueryForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({
      ...prev,
      subject: category,
    }));
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "General Inquiry",
      message: "",
    });
    setErrorMessage("");
    setSubmissionResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!formData.subject.trim()) {
      setErrorMessage("Please select or specify a subject for your query.");
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage("Please write your message or query details.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/api/submit-query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit your query.");
      }

      setSubmissionResult({
        success: true,
        queryId: data.queryId,
        message: data.message,
      });

      // Clear the form fields
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (error) {
      console.error("Query submission error:", error);
      setErrorMessage(
        error.message || "Something went wrong. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-page">
      {/* Background ambient decorative glows */}
      <div className="query-bg-glow glow-primary" aria-hidden="true" />
      <div className="query-bg-glow glow-secondary" aria-hidden="true" />

      <div className="query-container">
        {/* Navigation & Breadcrumbs */}
        <div className="query-nav-bar">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
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

          <div className="query-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Query & Support</span>
          </div>
        </div>

        {/* Page Header */}
        <header className="query-header">
          <div className="query-badge">
            <span className="badge-pulse-indicator" />
            <span>Help Desk & Inquiries</span>
          </div>
          <h1 className="query-page-title">How Can We Help You?</h1>
          <p className="query-page-subtitle">
            Have a question about a campaign, donation verification, or starting your own cause?
            Send us a message and our support team will assist you.
          </p>
        </header>

        {/* Main Grid: Info Cards (Left) + Form (Right) */}
        <div className="query-grid">
          {/* ==========================================
              LEFT COLUMN: CONTACT INFO & HELP TOPICS
          ========================================== */}
          <aside className="query-info-sidebar">
            <div className="info-card highlight-card">
              <div className="info-card-header">
                <div className="info-icon-box blue">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="info-title">Fast Query Resolution</h3>
                  <p className="info-desc">
                    Every ticket is tracked and assigned directly to our campaign operations team.
                  </p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon-box green">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="info-subheading">Average Response Time</h4>
                <p className="info-value">Within 24 Hours</p>
                <span className="info-note">Monday through Saturday</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon-box purple">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h4 className="info-subheading">Direct Support Email</h4>
                <p className="info-value">support@crowdfund.org</p>
                <span className="info-note">For urgent escalation</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon-box cyan">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h4 className="info-subheading">Data Privacy & Security</h4>
                <p className="info-desc">
                  Your contact details are strictly confidential and stored securely in our official registry.
                </p>
              </div>
            </div>
          </aside>

          {/* ==========================================
              RIGHT COLUMN: QUERY SUBMISSION FORM
          ========================================== */}
          <main className="query-form-card">
            {/* Success Notification Banner */}
            {submissionResult ? (
              <div className="query-success-panel">
                <div className="success-icon-badge">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 className="success-heading">Query Submitted Successfully!</h2>

                <p className="success-subtext">
                  Thank you for reaching out. Your query has been logged and assigned the reference tracking ID below:
                </p>

                <div className="query-ticket-pill">
                  <span className="ticket-label">Tracking ID:</span>
                  <span className="ticket-id">{submissionResult.queryId}</span>
                </div>

                <div className="success-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setSubmissionResult(null)}
                  >
                    Submit Another Query
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate("/")}
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            ) : (
              <form className="query-form" onSubmit={handleSubmit} noValidate>
                <div className="form-top-bar">
                  <div>
                    <h2 className="form-card-title">Send Us a Message</h2>
                    <p className="form-card-subtitle">
                      Fill in the details below and we will get back to you promptly.
                    </p>
                  </div>
                  <span className="query-status-chip">Official Registry</span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="form-error-banner" role="alert">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="form-row-two">
                  {/* Full Name */}
                  <div className="form-field-group">
                    <label htmlFor="query-name" className="field-label">
                      Full Name <span className="req-star">*</span>
                    </label>
                    <div className="field-input-box">
                      <span className="field-icon" aria-hidden="true">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        id="query-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Satyam Mishra"
                        required
                        className="field-input with-icon"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="form-field-group">
                    <label htmlFor="query-email" className="field-label">
                      Email Address <span className="req-star">*</span>
                    </label>
                    <div className="field-input-box">
                      <span className="field-icon" aria-hidden="true">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      <input
                        id="query-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. name@example.com"
                        required
                        className="field-input with-icon"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Subject Row */}
                <div className="form-row-two">
                  {/* Phone Number */}
                  <div className="form-field-group">
                    <label htmlFor="query-phone" className="field-label">
                      Phone Number <span className="optional-tag">(Optional)</span>
                    </label>
                    <div className="field-input-box">
                      <span className="field-icon" aria-hidden="true">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        id="query-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. +91 9876543210"
                        className="field-input with-icon"
                      />
                    </div>
                  </div>

                  {/* Subject Dropdown */}
                  <div className="form-field-group">
                    <label htmlFor="query-subject" className="field-label">
                      Query Subject / Topic <span className="req-star">*</span>
                    </label>
                    <div className="field-input-box">
                      <select
                        id="query-subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="field-select"
                      >
                        {QUERY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quick Subject Pills */}
                <div className="quick-category-section">
                  <span className="quick-label">Or choose topic:</span>
                  <div className="quick-pills-row">
                    {QUERY_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-pill ${
                          formData.subject === cat ? "active" : ""
                        }`}
                        onClick={() => handleCategorySelect(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Field */}
                <div className="form-field-group">
                  <div className="label-with-counter">
                    <label htmlFor="query-message" className="field-label">
                      Message / Query Details <span className="req-star">*</span>
                    </label>
                    <span className="char-counter">
                      {formData.message.length} characters
                    </span>
                  </div>

                  <textarea
                    id="query-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Please explain your question or concern in detail..."
                    required
                    className="field-textarea"
                  />
                  <p className="field-hint">
                    Include any campaign links, donor names, or transaction details if applicable.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="query-form-actions">
                  <button
                    type="button"
                    className="btn-clear"
                    onClick={handleReset}
                    disabled={
                      loading ||
                      (!formData.name &&
                        !formData.email &&
                        !formData.phone &&
                        !formData.message)
                    }
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    className="btn-submit-query"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="btn-loading-state">
                        <span className="spinner-dot" aria-hidden="true" />
                        <span>Submitting Query...</span>
                      </span>
                    ) : (
                      <span className="btn-content">
                        <span>Submit Query</span>
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
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default QueryForm;
