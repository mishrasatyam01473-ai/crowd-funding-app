import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./Login.css";

const Login = ({ initialSignUp = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Determine initial mode based on prop or ?mode=signup query param
    const modeParam = searchParams.get("mode") || searchParams.get("tab");
    const [isSignUp, setIsSignUp] = useState(
        initialSignUp || modeParam === "signup" || modeParam === "register"
    );

    // Form input states
    const [name, setName] = useState("");
    const [mailid, setMailid] = useState("");
    const [passcode, setPasscode] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");
    const [showPasscode, setShowPasscode] = useState(false);

    // Feedback states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Target route to redirect to after authentication (default to /dashboard)
    const redirectTarget = (location.state?.from && location.state.from !== "/" && location.state.from !== "/user-login" && location.state.from !== "/login")
        ? location.state.from
        : "/dashboard";
    const wasRedirectedFromProtected = Boolean(
        location.state?.from &&
        location.state.from !== "/" &&
        location.state.from !== "/user-login" &&
        location.state.from !== "/login"
    );

    // If user is already logged in, redirect directly to dashboard
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed && (parsed.id || parsed.mailid)) {
                    navigate("/dashboard", { replace: true });
                }
            } catch {
                // Invalid user entry in localStorage, let them log in
            }
        }
    }, [navigate]);

    // Handle switching between Sign In and Sign Up tabs
    const handleModeSwitch = (signUpMode) => {
        setIsSignUp(signUpMode);
        setError("");
        setMessage("");
        setPasscode("");
        setConfirmPasscode("");
        // Update URL query parameter without full reload
        setSearchParams(signUpMode ? { mode: "signup" } : {});
    };

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const cleanEmail = mailid.trim().toLowerCase();
        const cleanPasscode = passcode.trim();

        // Validation for both modes
        if (!cleanEmail || !cleanPasscode) {
            setError("Please fill in all required fields.");
            return;
        }

        // Validation for Sign Up mode
        if (isSignUp) {
            if (cleanPasscode.length < 4) {
                setError("Passcode must be at least 4 characters long.");
                return;
            }

            if (cleanPasscode !== confirmPasscode.trim()) {
                setError("Passcodes do not match. Please verify.");
                return;
            }
        }

        setLoading(true);

        try {
            const endpoint = isSignUp ? `${API_BASE_URL}/api/signup` : `${API_BASE_URL}/api/login`;
            const payload = isSignUp
                ? { name: name.trim(), mailid: cleanEmail, passcode: cleanPasscode }
                : { mailid: cleanEmail, passcode: cleanPasscode };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log(isSignUp ? "Signup response:" : "Login response:", data);

            if (!response.ok) {
                throw new Error(data.message || (isSignUp ? "Registration failed" : "Login failed"));
            }

            // Authentication successful
            setMessage(
                isSignUp
                    ? "Account created successfully! Redirecting to your dashboard..."
                    : "Login successful! Redirecting to your dashboard..."
            );

            // Persist authenticated user and dispatch event for Navbar/App sync
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
                window.dispatchEvent(new Event("authChange"));
            }

            // Redirect smoothly to destination (or /dashboard)
            setTimeout(() => {
                navigate(redirectTarget, { replace: true });
            }, 600);

        } catch (err) {
            console.error("Auth error:", err);
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* Redirected Notification Badge */}
                {wasRedirectedFromProtected && (
                    <div className="auth-alert-notice">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Please log in or sign up to access your dashboard.</span>
                    </div>
                )}

                {/* Mode Selector Tabs */}
                <div className="auth-tab-switch">
                    <button
                        type="button"
                        id="signin-tab-btn"
                        className={`auth-tab-btn ${!isSignUp ? "active" : ""}`}
                        onClick={() => handleModeSwitch(false)}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        id="signup-tab-btn"
                        className={`auth-tab-btn ${isSignUp ? "active" : ""}`}
                        onClick={() => handleModeSwitch(true)}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Header Title & Subtitle */}
                <div className="auth-header">
                    <h1>{isSignUp ? "Create an Account" : "Welcome Back"}</h1>
                    <p className="login-subtitle">
                        {isSignUp
                            ? "Sign up to start fundraising or track your contributions"
                            : "Login to access your personal dashboard and history"}
                    </p>
                </div>

                {/* Feedback Alerts */}
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                {/* Main Auth Form */}
                <form onSubmit={handleSubmit} noValidate>

                    {/* Name Field (Sign Up Only) */}
                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="user-name">
                                Full Name <span className="optional-tag">(Optional)</span>
                            </label>
                            <input
                                id="user-name"
                                type="text"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Satyam Mishra"
                                autoFocus={isSignUp}
                            />
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="form-group">
                        <label htmlFor="mailid">Email Address</label>
                        <input
                            id="mailid"
                            type="email"
                            name="mailid"
                            value={mailid}
                            onChange={(e) => setMailid(e.target.value)}
                            placeholder="name@example.com"
                            required
                            autoFocus={!isSignUp}
                        />
                    </div>

                    {/* Passcode Field */}
                    <div className="form-group">
                        <div className="label-row">
                            <label htmlFor="passcode">
                                {isSignUp ? "Create Passcode" : "Passcode"}
                            </label>
                            <button
                                type="button"
                                className="toggle-passcode-btn"
                                onClick={() => setShowPasscode(!showPasscode)}
                                tabIndex="-1"
                            >
                                {showPasscode ? "Hide" : "Show"}
                            </button>
                        </div>
                        <input
                            id="passcode"
                            type={showPasscode ? "text" : "password"}
                            name="passcode"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder={isSignUp ? "At least 4 characters" : "Enter your passcode"}
                            required
                        />
                    </div>

                    {/* Confirm Passcode (Sign Up Only) */}
                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="confirmPasscode">Confirm Passcode</label>
                            <input
                                id="confirmPasscode"
                                type={showPasscode ? "text" : "password"}
                                name="confirmPasscode"
                                value={confirmPasscode}
                                onChange={(e) => setConfirmPasscode(e.target.value)}
                                placeholder="Re-enter your passcode"
                                required
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        id="auth-submit-btn"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? isSignUp
                                ? "Creating Account..."
                                : "Signing In..."
                            : isSignUp
                                ? "Create Account & Continue"
                                : "Sign In to Dashboard"}
                    </button>
                </form>

                {/* Footer Switcher */}
                <div className="auth-footer">
                    {isSignUp ? (
                        <p>
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="auth-toggle-link"
                                onClick={() => handleModeSwitch(false)}
                            >
                                Sign in here
                            </button>
                        </p>
                    ) : (
                        <p>
                            Don't have an account yet?{" "}
                            <button
                                type="button"
                                className="auth-toggle-link"
                                onClick={() => handleModeSwitch(true)}
                            >
                                Sign up here
                            </button>
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Login;