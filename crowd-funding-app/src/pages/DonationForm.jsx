import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { getAuthUser } from "../utils/auth.js";
import "./DonationForm.css";

const PRESET_AMOUNTS = [250, 500, 1000, 2500, 5000];

const DonationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const campaign = location.state || {};

  const [campaignId, setCampaignId] = useState(campaign.campaignId || campaign._id || "");
  const [campaignName, setCampaignName] = useState(campaign.campaignName || campaign.title || "");
  const [creatorName, setCreatorName] = useState(campaign.creatorName || campaign.creator || "");
  const [description, setDescription] = useState(campaign.description || "");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    if (user?.mailid) {
      setDonorEmail(user.mailid);
    }
  }, []);

  useEffect(() => {
    if (!campaignName || !creatorName) {
      fetch(`${API_BASE_URL}/api/campaigns`)
        .then((res) => res.json())
        .then((campaignsList) => {
          if (Array.isArray(campaignsList) && campaignsList.length > 0) {
            let matched = null;
            if (campaignId) {
              matched = campaignsList.find((c) => String(c._id) === String(campaignId));
            }
            if (!matched && campaignsList[0]) {
              matched = campaignsList[0];
            }
            if (matched) {
              if (!campaignId) setCampaignId(matched._id);
              if (!campaignName) setCampaignName(matched.title || "Community Campaign");
              if (!creatorName) setCreatorName(matched.creator || "Verified Creator");
              if (!description) setDescription(matched.description || "");
            }
          }
        })
        .catch((err) => console.warn("Notice loading campaign context:", err.message));
    }
  }, [campaignId, campaignName, creatorName, description]);

  const handlePresetSelect = (preset) => {
    setAmount(String(preset));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!donorName.trim()) {
      alert("Please enter donor name.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/create-donation-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          creatorName,
          campaignName,
          description,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          amount: Number(amount),
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.message || "Unable to create payment order.");
      }

      if (!window.Razorpay) {
        alert("Razorpay could not be loaded. Please refresh the page.");
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Crowdfunding Website",
        description: campaignName ? `Donation for ${campaignName}` : "Support Crowdfunding Cause",
        order_id: orderData.orderId,
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/api/verify-donation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                campaignId,
                creatorName,
                campaignName,
                description,
                donorName: donorName.trim(),
                donorEmail: donorEmail.trim(),
                amount: Number(amount),
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }),
            });

            const result = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(result.message || "Payment verification failed.");
            }

            alert("Donation successful! Thank you for your generous support.");

            setDonorName("");
            setAmount("");

            navigate("/donation-history");
          } catch (error) {
            console.error("Verification error:", error);
            alert(error.message || "Payment verification failed.");
            setLoading(false);
          }
        },
        prefill: {
          name: donorName.trim(),
        },
        notes: {
          campaignId: String(campaignId),
          campaignName,
        },
        theme: {
          color: "#1687ff",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (res) => {
        console.error("Payment failed:", res);
        alert(res.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Donation error:", error);
      alert(error.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDonorName("");
    setAmount("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getInitials = (name) => {
    if (!name) return "CF";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="donation-page">
      <div className="donation-bg-glow glow-1" aria-hidden="true" />
      <div className="donation-bg-glow glow-2" aria-hidden="true" />

      <div className="donation-container">
        <div className="donation-nav-bar">
          <button
            type="button"
            className="back-nav-btn"
            onClick={handleBack}
            aria-label="Back to previous page"
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

          <div className="donation-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Make a Donation</span>
          </div>
        </div>

        <div className="donation-header">
          <div className="header-badge">
            <span className="badge-pulse-dot" />
            <span>Empower & Support</span>
          </div>
          <h1 className="donation-title">Complete Your Donation</h1>
          <p className="donation-subtitle">
            Your generous contribution fuels real, lasting impact. 100% of your funds go directly toward empowering this verified initiative.
          </p>
        </div>

        <div className="donation-content-grid">
          <aside className="campaign-summary-card">
            <div className="campaign-card-header">
              <span className="campaign-chip">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Selected Campaign
              </span>

              {campaignId && (
                <span className="campaign-id-badge" title={`Campaign ID: ${campaignId}`}>
                  ID: #{String(campaignId).slice(-6)}
                </span>
              )}
            </div>

            <h2 className="campaign-display-title">
              {campaignName || "General Community Support Initiative"}
            </h2>

            <div className="creator-profile-box">
              <div className="creator-avatar" aria-hidden="true">
                {getInitials(creatorName)}
              </div>
              <div className="creator-details">
                <span className="creator-label">Organized by</span>
                <span className="creator-name">{creatorName || "Verified Project Lead"}</span>
                <span className="creator-verified-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Verified Organizer
                </span>
              </div>
            </div>

            <div className="campaign-description-section">
              <h3 className="section-label">About this Cause</h3>
              <div className="campaign-description-body">
                {description ? (
                  <p>{description}</p>
                ) : (
                  <p className="description-placeholder">
                    This initiative is actively working to bring tangible positive change to the community. Your backing makes immediate progress possible.
                  </p>
                )}
              </div>
            </div>

            <div className="campaign-trust-box">
              <div className="trust-item">
                <div className="trust-icon shield">
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h4>100% Secure & Verified</h4>
                  <p>Bank-grade 256-bit SSL encrypted checkout</p>
                </div>
              </div>

              <div className="trust-item">
                <div className="trust-icon heart">
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
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <h4>Direct Cause Impact</h4>
                  <p>Transparent disbursement directly to campaign goals</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="donation-form-wrapper">
            <form className="donation-card-form" onSubmit={handleSubmit} noValidate>
              <div className="form-card-header">
                <h2>Donation Details</h2>
                <span className="step-pill">Secure Step</span>
              </div>

              <div className="active-campaign-banner">
                <div className="banner-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="banner-content">
                  <span className="banner-sub">Campaign:</span>
                  <strong className="banner-title">{campaignName || "Community Initiative"}</strong>
                  <div className="banner-creator-row">
                    <span className="banner-creator-label">Campaign Creator:</span>
                    <span className="banner-creator-val">{creatorName || "Verified Project Lead"}</span>
                  </div>
                </div>
              </div>

              <div className="amount-preset-section">
                <label className="input-group-label">Select an Amount (INR)</label>
                <div className="preset-buttons-row">
                  {PRESET_AMOUNTS.map((preset) => {
                    const isSelected = String(amount) === String(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        className={`preset-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        ₹{preset.toLocaleString("en-IN")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group custom-amount-group">
                <label htmlFor="donation-amount" className="input-group-label">
                  Or Enter Custom Amount <span className="required-star">*</span>
                </label>

                <div className="custom-amount-wrapper">
                  <div className="currency-prefix-badge">₹</div>
                  <input
                    id="donation-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 1500)"
                    min="1"
                    step="1"
                    required
                    className="donation-input amount-field"
                  />
                  {amount && Number(amount) > 0 && <span className="currency-suffix-tag">INR</span>}
                </div>
                <p className="input-helper-text">Minimum contribution is ₹1. Every rupee counts.</p>
              </div>

              <div className="form-group">
                <label htmlFor="donor-name" className="input-group-label">
                  Your Full Name <span className="required-star">*</span>
                </label>

                <div className="input-icon-wrapper">
                  <span className="input-icon" aria-hidden="true">
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
                    id="donor-name"
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Satyam Mishra"
                    required
                    className="donation-input with-icon"
                  />
                </div>
                <p className="input-helper-text">
                  This will appear in the campaign supporter list and receipt.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="donor-email" className="input-group-label">
                  Your Email (for Receipt & History)
                </label>

                <div className="input-icon-wrapper">
                  <span className="input-icon" aria-hidden="true">
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
                    id="donor-email"
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="donation-input with-icon"
                  />
                </div>
                <p className="input-helper-text">
                  Used to link this contribution to your Donation History.
                </p>
              </div>

              <div className="donation-summary-banner">
                <div className="summary-banner-content">
                  <span className="summary-title">Total Contribution:</span>
                  <span className="summary-amount">
                    {amount && Number(amount) > 0
                      ? `₹${Number(amount).toLocaleString("en-IN")}`
                      : "₹0"}
                  </span>
                </div>
              </div>

              <div className="donation-action-buttons">
                <button
                  type="button"
                  className="btn-action btn-back"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  className="btn-action btn-reset"
                  onClick={handleReset}
                  disabled={loading || (!donorName && !amount)}
                >
                  <span>Reset</span>
                </button>

                <button type="submit" className="btn-action btn-submit" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading-state">
                      <span className="spinner-circle" aria-hidden="true" />
                      <span>Processing...</span>
                    </span>
                  ) : (
                    <span className="btn-submit-content">
                      <span>Proceed to Payment</span>
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
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>

              <div className="razorpay-trust-footer">
                <div className="security-icon-circle">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="security-text-group">
                  <p className="security-main">
                    Secured by <strong>Razorpay Payment Gateway</strong>
                  </p>
                  <p className="security-sub">
                    UPI, Credit/Debit Cards, NetBanking, and Wallets accepted
                  </p>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DonationForm;