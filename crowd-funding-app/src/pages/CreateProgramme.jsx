import React, { useState } from "react";
import { API_BASE_URL } from "../config";
import "./CreateProgramme.css";

const CreateProgramme = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mailid: "",
    passcode: "",
    goal: "",
    creator: "",
    image: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/campaignRegistration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create campaign");
      }

      setMessage("Campaign created successfully! Your campaign will be active within 12 hours.");
      setFormData({
        title: "",
        description: "",
        mailid: "",
        passcode: "",
        goal: "",
        creator: "",
        image: "",
      });
    } catch (err) {
      console.error("Create campaign error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-campaign-page">
      <div className="create-campaign-card">
        <h1>Create a Campaign</h1>
        <p className="subtitle">Start your crowdfunding campaign</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Campaign Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter campaign title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your campaign"
              rows="6"
              required
            />
          </div>

          <div className="form-group">
            <label>Enter Email</label>
            <input
              type="email"
              name="mailid"
              value={formData.mailid}
              onChange={handleChange}
              placeholder="example@xyz.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Login Passcode</label>
            <input
              type="password"
              name="passcode"
              value={formData.passcode}
              onChange={handleChange}
              placeholder="Create your Login Passcode"
              required
            />
          </div>

          <div className="form-group">
            <label>Funding Goal</label>
            <input
              type="number"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              placeholder="Enter amount"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Creator Name</label>
            <input
              type="text"
              name="creator"
              value={formData.creator}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Enter image URL"
            />
          </div>

          <button type="submit" className="create-button" disabled={loading}>
            {loading ? "Creating..." : "Create Programme"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProgramme;