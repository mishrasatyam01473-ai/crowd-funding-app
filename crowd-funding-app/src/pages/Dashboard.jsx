import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [campaign, setCampaign] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // ==========================================
                // GET USER FROM LOCAL STORAGE
                // ==========================================

                const storedUser = localStorage.getItem("user");

                if (!storedUser) {
                    navigate("/user-login");
                    return;
                }

                const parsedUser = JSON.parse(storedUser);

                // ==========================================
                // FETCH USER + CAMPAIGN
                // ==========================================

                const identifier = parsedUser.id || parsedUser.mailid;
                const response = await fetch(
                    `${API_BASE_URL}/api/user/${identifier}`
                );

                const data = await response.json();

                console.log("Dashboard data:", data);

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch dashboard"
                    );
                }

                // ==========================================
                // SET DATA
                // ==========================================

                setUser(data.user || parsedUser);
                setCampaign(data.campaign);

            } catch (error) {
                console.error("Dashboard error:", error);

                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChange"));
        navigate("/user-login");
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading your dashboard...
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error) {
        return (
            <div className="dashboard-error">
                <h2>Something went wrong</h2>

                <p>{error}</p>

                <button onClick={() => {
                    localStorage.removeItem("user");
                    window.dispatchEvent(new Event("authChange"));
                    navigate("/user-login");
                }}>
                    Go to Login
                </button>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="dashboard-page">

            {/* ==========================================
          HEADER
      ========================================== */}

            <div className="dashboard-header">

                <div>
                    <h1>My Dashboard</h1>

                    <p>
                        Welcome back, {campaign?.creator || user?.mailid || "User"}
                    </p>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>


            {/* ==========================================
          USER INFORMATION
      ========================================== */}

            <div className="user-section">

                <h2>User Information</h2>

                <div className="user-card">

                    <div className="user-info">

                        <span className="info-label">
                            Email
                        </span>

                        <span className="info-value">
                            {user?.mailid}
                        </span>

                    </div>


                    <div className="user-info">

                        <span className="info-label">
                            Creator
                        </span>

                        <span className="info-value">
                            {campaign?.creator}
                        </span>

                    </div>

                </div>

            </div>


            {/* ==========================================
          CAMPAIGN SECTION
      ========================================== */}

            <div className="campaign-section">

                <h2>My Campaign</h2>

                {campaign ? (

                    <div className="campaign-card">

                        {/* IMAGE */}

                        {campaign.image && (
                            <div className="campaign-image-container">

                                <img
                                    src={campaign.image}
                                    alt={campaign.title}
                                    className="campaign-image"
                                />

                            </div>
                        )}


                        {/* CAMPAIGN INFORMATION */}

                        <div className="campaign-content">

                            <h3>
                                {campaign.title}
                            </h3>

                            <p className="campaign-description">
                                {campaign.description}
                            </p>


                            {/* GOAL */}

                            <div className="campaign-detail">

                                <span>
                                    Funding Goal
                                </span>

                                <strong>
                                    ₹{Number(campaign.goal).toLocaleString("en-IN")}
                                </strong>

                            </div>


                            {/* RAISED */}

                            <div className="campaign-detail">

                                <span>
                                    Amount Raised
                                </span>

                                <strong>
                                    ₹{Number(campaign.raised || 0).toLocaleString("en-IN")}
                                </strong>

                            </div>


                            {/* CREATED DATE */}

                            {campaign.createdAt && (

                                <div className="campaign-detail">

                                    <span>
                                        Created
                                    </span>

                                    <strong>
                                        {new Date(
                                            campaign.createdAt
                                        ).toLocaleDateString("en-IN")}
                                    </strong>

                                </div>

                            )}

                        </div>

                    </div>

                ) : (
                    <div style={{ padding: "36px 20px", textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.2)" }}>
                        <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "16px", fontSize: "1.05rem" }}>
                            You have not registered any campaign yet.
                        </p>
                        <button
                            onClick={() => navigate("/create-programme")}
                            style={{
                                padding: "10px 22px",
                                background: "#ff4757",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.95rem"
                            }}
                        >
                            Create a Programme
                        </button>
                    </div>
                )}

            </div>

        </div>
    );
};

export default Dashboard;