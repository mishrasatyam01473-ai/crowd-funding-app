import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./Login.css";
const Login = () => {
    const navigate = useNavigate();

    const [mailid, setMailid] = useState("");
    const [passcode, setPasscode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", },
                    body: JSON.stringify({ mailid: mailid, passcode: passcode, }),
                });
            const data = await response.json();
            console.log("Login response:", data);
            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            } // Login successful 
            setMessage("Login successful!");
            console.log("Logged in user:", data.user); // Save login information 
            localStorage.setItem("user", JSON.stringify(data.user)); // Redirect after successful login 
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (error) {
            console.error("Login error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Login</h1>
                <p className="login-subtitle"> Login to your account </p>
                {/* SUCCESS MESSAGE */}
                {message && (<div className="success-message"> {message} </div>)}
                {/* ERROR MESSAGE */}
                {error && (<div className="error-message"> {error} </div>)}

                <form onSubmit={handleLogin}>
                    {/* EMAIL */}
                    <div className="form-group">
                        <label htmlFor="mailid"> Email </label>
                        <input
                            id="mailid"
                            type="email"
                            name="mailid"
                            value={mailid}
                            onChange={
                                (e) => setMailid(e.target.value)
                            }
                            placeholder="Enter your email" required />
                    </div>

                    {/* PASSCODE */}
                    <div className="form-group">
                        <label htmlFor="passcode"> Passcode </label>
                        <input
                            id="passcode"
                            type="password"
                            name="passcode"
                            value={passcode}
                            onChange={
                                (e) => setPasscode(e.target.value)
                            }
                            placeholder="Enter your passcode" required />
                    </div>

                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading} >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default Login;