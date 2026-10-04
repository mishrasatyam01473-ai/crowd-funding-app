import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./IndexPage.css";

const IndexPage = () => {
  const navigate = useNavigate();


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
        const response = await fetch(
          `${API_BASE_URL}/api/campaigns`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch campaigns from server");
        }

        const data = await response.json();
        console.log("Camapigns data Fetch ho gaya");  //console me 
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

  return (
    <div className="index-container">


      <header className="hero-section">
        <div className="hero-content">

          <h1 className="hero-title">
            Fund the Future.
          </h1>

          <p className="hero-subtitle">
            Join a global community of backers helping creators
            bring their boldest ideas to life.
          </p>

          <div className="hero-actions">
            <button className="btn-primary"
            //onClick={() => navigate("/create-programme")}
            >
              Start a Campaign
            </button>

            <button className="btn-secondary"
            //onClick={() => navigate("/explore")}
            >
              Explore Projects
            </button>
          </div>

        </div>
      </header>



      <section className="dynamic-section">

        <div className="section-header">

          <h2>Featured Projects</h2>

          <a
            href="/explore"
            className="view-all-link"
          >
            View all →
          </a>

        </div>


        {/* Loading */}

        {isLoading && (
          <div className="loading-state">
            Loading live projects...
          </div>
        )}


        {/* Error */}

        {error && (
          <div className="error-state">
            Error: {error}
          </div>
        )}


        {/* Campaigns */}

        {!isLoading && !error && (

          <div className="campaign-grid">

            {campaigns.length === 0 ? (

              <p>No campaigns found.</p>

            ) : (

              campaigns.map((campaign) => {


                return (

                  <div
                    key={campaign._id}
                    className="campaign-card"
                  >


                    <div className="campaign-details">

                      <h3 className="campaign-title">
                        {campaign.title}
                      </h3>


                      <p className="campaign-description">
                        {campaign.description}
                      </p>


                      <p className="campaign-creator">
                        by {campaign.creator}
                      </p>


                      {/* Statistics */}

                      <div className="campaign-stats">

                        <div className="stat">

                          <span className="stat-value">
                            ₹{(campaign.goal || 0).toLocaleString()}
                          </span>

                          <span className="stat-label">
                            goal
                          </span>


                        </div>

                      </div>

                      <button
                        onClick={() => handleDonate(campaign)}
                      >
                        Donate
                      </button>

                    </div>

                  </div>

                );

              })

            )}

          </div>

        )}

      </section>

    </div>
  );
};

export default IndexPage;