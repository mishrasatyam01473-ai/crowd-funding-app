require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");
const Razorpay = require("razorpay");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5172",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.some((o) => origin && origin.startsWith(o)) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Crowdfunding API server is running smoothly.",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// MONGODB CONNECTION
// ==========================================

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/crowdfunding";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


// ==========================================
// CAMPAIGNS SCHEMA
// ==========================================

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    goal: {
      type: Number,
      required: true,
    },

    creator: {
      type: String,
      required: true,
    },
  },
  {
    collection: "campaigns",
  }
);


// ==========================================
// CAMPAIGNS MODEL
// ==========================================

const Campaign = mongoose.model(
  "Campaign",
  campaignSchema
);


// ==========================================
// GET CAMPAIGNS
// ==========================================

app.get("/api/campaigns", async (req, res) => {

  try {

    const campaigns = await Campaign.find({});

    console.log("Campaigns fetched:");

    res.status(200).json(campaigns);

  } catch (error) {

    console.error("Error fetching campaigns:", error);

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });

  }

});


// ==========================================
// CAMPAIGN REGISTRATION SCHEMA
// This collection will NOT store mailid/passcode
// ==========================================

const RegistrationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    mailid: {
      type: String,
      required: true,
    },

    goal: {
      type: Number,
      required: true,
    },

    creator: {
      type: String,
      required: true,
    },

    raised: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "campaignRegistration",
  }
);

// ==========================================
// CAMPAIGN MODEL
// ==========================================

const CampaignRegistration = mongoose.model(
  "CampaignRegistration",
  RegistrationSchema
);

// ==========================================
// LOGIN DATA SCHEMA
// This collection will ONLY store email/passcode
// ==========================================

const LoginDataSchema = new mongoose.Schema(
  {
    mailid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    passcode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "LoginData",
  }
);

// ==========================================
// LOGIN DATA MODEL
// ==========================================

const LoginData = mongoose.model(
  "LoginData",
  LoginDataSchema
);

// ==========================================
// GET CAMPAIGNS
// ==========================================

app.get("/api/campaigns", async (req, res) => {
  try {
    const campaigns = await CampaignRegistration.find({});

    console.log("Campaigns fetched successfully");

    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// ==========================================
// CREATE CAMPAIGN
// ==========================================

app.post("/api/campaignRegistration", async (req, res) => {
  try {
    console.log("================================");
    console.log("Data received from React:");
    console.log(req.body);
    console.log("================================");

    // Get data from React
    const {
      title,
      description,
      mailid,
      passcode,
      goal,
      creator,
      image,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!title) {
      return res.status(400).json({
        message: "Title required",
      });
    }

    if (!description) {
      return res.status(400).json({
        message: "Description required",
      });
    }

    if (!mailid) {
      return res.status(400).json({
        message: "Email required",
      });
    }

    if (!passcode) {
      return res.status(400).json({
        message: "Passcode required",
      });
    }

    if (!goal) {
      return res.status(400).json({
        message: "Goal required",
      });
    }

    if (!creator) {
      return res.status(400).json({
        message: "Creator required",
      });
    }

    // ==========================================
    // CHECK IF EMAIL ALREADY EXISTS
    // ==========================================

    const existingLogin = await LoginData.findOne({
      mailid: mailid,
    });

    if (existingLogin) {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    // ==========================================
    // SAVE CAMPAIGN DATA
    // WITHOUT EMAIL AND PASSCODE
    // ==========================================

    const newCampaign = new CampaignRegistration({
      title: title,
      description: description,
      mailid: mailid,
      goal: Number(goal),
      creator: creator,
      raised: 0,
      image: image || "",
    });

    const savedCampaign = await newCampaign.save();

    console.log("Campaign saved successfully:");
    console.log(savedCampaign);

    // ==========================================
    // SAVE LOGIN DATA
    // ONLY EMAIL AND PASSCODE
    // ==========================================

    const newLoginData = new LoginData({
      mailid: mailid,
      passcode: passcode,
    });

    const savedLoginData = await newLoginData.save();

    console.log("Login data saved successfully:");
    console.log(savedLoginData);

    // ========================================== SEND RESPONSE ==========================================

    res.status(201).json({
      message: "Campaign and login data created successfully",

      campaign: savedCampaign,

      login: {
        id: savedLoginData._id,
        mailid: savedLoginData.mailid,
      },
    });

  } catch (error) {
    console.error("================================");
    console.error("ERROR CREATING CAMPAIGN");
    console.error(error);
    console.error("================================");

    res.status(500).json({
      message: "Failed to create campaign",
      error: error.message,
    });
  }
});

// ========================================== LOGIN API ==========================================

app.post("/api/login", async (req, res) => {
  try {
    const { mailid, passcode } = req.body;

    console.log("Login attempt:", mailid);

    // Validate
    if (!mailid || !passcode) {
      return res.status(400).json({
        message: "Email and passcode are required",
      });
    }

    // Find email
    const user = await LoginData.findOne({
      mailid: mailid,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or passcode",
      });
    }

    // Check passcode
    if (user.passcode !== passcode) {
      return res.status(401).json({
        message: "Invalid email or passcode",
      });
    }

    // Login successful
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        mailid: user.mailid,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});


// ========================================== // GET USER DASHBOARD // ========================================== 
app.get("/api/user/:mailid", async (req, res) => {
  try {
    const userId = req.params.mailid; // Find login data 
    const user = await LoginData.findOne({ mailid: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found", });
    } // Find campaign 
    const campaign = await CampaignRegistration.findById(user.campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found", });
    } res.status(200).json({ user: { id: user._id, mailid: user.mailid, }, campaign: campaign, });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch user information", error: error.message, });
  }
});




// =====================================================
// RAZORPAY
// =====================================================

if (
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET
) {
  console.warn(
    "WARNING: Razorpay credentials are missing."
  );
}

const razorpay = new Razorpay({
  key_id:
    process.env.RAZORPAY_KEY_ID,

  key_secret:
    process.env.RAZORPAY_KEY_SECRET,
});

const DATA_FOLDER =
  process.env.DATA_FOLDER ||
  (fs.existsSync(path.join(__dirname, "..", "data"))
    ? path.join(__dirname, "..", "data")
    : path.join(__dirname, "data"));

try {
  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER, {
      recursive: true,
    });
  }
} catch (folderErr) {
  console.warn("Notice regarding data folder:", folderErr.message);
}

// =====================================================
// DONATION EXCEL FILE
// =====================================================

const donationExcelFile =
  path.join(
    DATA_FOLDER,
    "DonationData.xlsx"
  );

// =====================================================
// EXCEL HEADERS
// =====================================================

const donationHeaders = [
  "Donation ID",
  "Campaign ID",
  "Creator Name",
  "Campaign Name",
  "Campaign Description",
  "Donor Name",
  "Amount",
  "Currency",
  "Razorpay Order ID",
  "Razorpay Payment ID",
  "Payment Status",
  "Donation Date",
];

// =====================================================
// CREATE EXCEL FILE
// =====================================================

const createDonationExcelFile =
  () => {
    try {
      if (
        !fs.existsSync(
          donationExcelFile
        )
      ) {
        const workbook =
          XLSX.utils.book_new();

        const worksheet =
          XLSX.utils.aoa_to_sheet([
            donationHeaders,
          ]);

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Donations"
        );

        XLSX.writeFile(
          workbook,
          donationExcelFile
        );

        console.log(
          "DonationData.xlsx created successfully."
        );
      }
    } catch (error) {
      console.error(
        "Error creating Excel file:",
        error
      );
    }
  };

createDonationExcelFile();

// =====================================================
// QUERY EXCEL FILE SETUP
// =====================================================

const queryExcelFile = path.join(
  DATA_FOLDER,
  "QueryData.xlsx"
);

const queryHeaders = [
  "Query ID",
  "Name",
  "Email",
  "Phone",
  "Subject",
  "Message",
  "Status",
  "Submitted Date",
];

const createQueryExcelFile = () => {
  try {
    const fileExists = fs.existsSync(queryExcelFile);
    let isZeroByte = false;
    if (fileExists) {
      const stats = fs.statSync(queryExcelFile);
      if (stats.size === 0) {
        isZeroByte = true;
      }
    }

    if (!fileExists || isZeroByte) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([queryHeaders]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Queries");
      XLSX.writeFile(workbook, queryExcelFile);
      console.log("QueryData.xlsx created/initialized successfully.");
    }
  } catch (error) {
    console.error("Error creating Query Excel file:", error);
  }
};

createQueryExcelFile();

// =====================================================
// SUBMIT USER QUERY ENDPOINT
// =====================================================

app.post("/api/submit-query", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your full name.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please specify a subject or query topic.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please describe your query in the message field.",
      });
    }

    // Ensure Query Excel file exists and is valid
    createQueryExcelFile();

    let workbook;
    try {
      workbook = XLSX.readFile(queryExcelFile);
    } catch (readErr) {
      console.warn("Could not read QueryData.xlsx, reinitializing:", readErr.message);
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([queryHeaders]);
      XLSX.utils.book_append_sheet(workbook, ws, "Queries");
      XLSX.writeFile(workbook, queryExcelFile);
    }

    let worksheet = workbook.Sheets["Queries"] || workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) {
      worksheet = XLSX.utils.aoa_to_sheet([queryHeaders]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Queries");
    }

    const existingData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });

    if (existingData.length === 0) {
      existingData.push(queryHeaders);
    }

    const queryId = `QRY-${Date.now()}`;
    const submittedDate = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    existingData.push([
      queryId,
      name.trim(),
      email.trim(),
      phone && phone.trim() ? phone.trim() : "N/A",
      subject.trim(),
      message.trim(),
      "PENDING",
      submittedDate,
    ]);

    const newWorksheet = XLSX.utils.aoa_to_sheet(existingData);
    workbook.Sheets["Queries"] = newWorksheet;
    if (!workbook.SheetNames.includes("Queries")) {
      XLSX.utils.book_append_sheet(workbook, newWorksheet, "Queries");
    }

    XLSX.writeFile(workbook, queryExcelFile);

    console.log("Query recorded successfully in QueryData.xlsx:", queryId);

    return res.status(200).json({
      success: true,
      message: "Your query has been submitted successfully! We will get back to you shortly.",
      queryId,
    });
  } catch (error) {
    console.error("Submit query error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while saving your query.",
      error: error.message,
    });
  }
});

// GET all queries
app.get("/api/queries", async (req, res) => {
  try {
    createQueryExcelFile();
    const workbook = XLSX.readFile(queryExcelFile);
    const worksheet = workbook.Sheets["Queries"] || workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return res.status(200).json({
      success: true,
      queries: data,
    });
  } catch (error) {
    console.error("Get queries error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch queries.",
      error: error.message,
    });
  }
});

// =====================================================
// CREATE DONATION ORDER
// =====================================================

app.post(
  "/api/create-donation-order",
  async (req, res) => {
    try {
      const {
        campaignId,
        creatorName,
        campaignName,
        description,
        donorName,
        amount,
      } = req.body;

      // -----------------------------------------------
      // VALIDATE DONOR NAME
      // -----------------------------------------------

      if (
        !donorName ||
        !donorName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Donor name is required.",
        });
      }

      // -----------------------------------------------
      // VALIDATE AMOUNT
      // -----------------------------------------------

      if (
        amount === undefined ||
        amount === null ||
        amount === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Donation amount is required.",
        });
      }

      const donationAmount =
        Number(amount);

      if (
        !Number.isFinite(
          donationAmount
        ) ||
        donationAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid donation amount.",
        });
      }

      // -----------------------------------------------
      // CONVERT RUPEES TO PAISE
      // -----------------------------------------------

      const amountInPaise =
        Math.round(
          donationAmount * 100
        );

      // -----------------------------------------------
      // CREATE RAZORPAY ORDER
      // -----------------------------------------------

      const options = {
        amount: amountInPaise,

        currency: "INR",

        receipt:
          `DON_${Date.now()}`,

        notes: {
          campaignId:
            String(
              campaignId || ""
            ),

          campaignName:
            String(
              campaignName || ""
            ),

          creatorName:
            String(
              creatorName || ""
            ),
        },
      };

      const order =
        await razorpay.orders.create(
          options
        );

      console.log(
        "Razorpay order created:",
        order.id
      );

      // -----------------------------------------------
      // SEND ORDER TO REACT
      // -----------------------------------------------

      return res.status(200).json({
        success: true,

        key:
          process.env.RAZORPAY_KEY_ID,

        orderId:
          order.id,

        amount:
          order.amount,

        currency:
          order.currency,
      });
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create Razorpay order.",
      });
    }
  }
);

// =====================================================
// VERIFY DONATION
// =====================================================

app.post(
  "/api/verify-donation",
  async (req, res) => {
    try {
      const {
        campaignId,
        creatorName,
        campaignName,
        description,
        donorName,
        amount,

        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body;

      // -----------------------------------------------
      // VALIDATE PAYMENT DATA
      // -----------------------------------------------

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Incomplete payment information.",
        });
      }

      // -----------------------------------------------
      // GENERATE SIGNATURE
      // -----------------------------------------------

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET
          )
          .update(
            `${razorpayOrderId}|${razorpayPaymentId}`
          )
          .digest("hex");

      // -----------------------------------------------
      // VERIFY SIGNATURE
      // -----------------------------------------------

      if (
        generatedSignature !==
        razorpaySignature
      ) {
        console.error(
          "Invalid Razorpay signature."
        );

        return res.status(400).json({
          success: false,

          message:
            "Payment verification failed.",
        });
      }

      console.log(
        "Payment verified:",
        razorpayPaymentId
      );

      // =================================================
      // MAKE SURE EXCEL FILE EXISTS
      // =================================================

      createDonationExcelFile();

      // =================================================
      // READ EXCEL
      // =================================================

      const workbook =
        XLSX.readFile(
          donationExcelFile
        );

      let worksheet =
        workbook.Sheets[
          "Donations"
        ];

      // =================================================
      // CREATE SHEET IF MISSING
      // =================================================

      if (!worksheet) {
        worksheet =
          XLSX.utils.aoa_to_sheet([
            donationHeaders,
          ]);

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Donations"
        );
      }

      // =================================================
      // READ EXISTING ROWS
      // =================================================

      const existingData =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            header: 1,
            defval: "",
          }
        );

      // =================================================
      // CHECK DUPLICATE PAYMENT
      // =================================================

      const duplicatePayment =
        existingData.some(
          (row, index) => {
            if (index === 0) {
              return false;
            }

            return (
              row[9] ===
              razorpayPaymentId
            );
          }
        );

      if (duplicatePayment) {
        return res.status(200).json({
          success: true,

          message:
            "Payment has already been recorded.",
        });
      }

      // =================================================
      // GENERATE DONATION ID
      // =================================================

      const donationId =
        `DON-${Date.now()}`;

      // =================================================
      // ADD DONATION
      // =================================================

      existingData.push([
        donationId,

        campaignId || "",

        creatorName || "",

        campaignName || "",

        description || "",

        donorName || "",

        Number(amount),

        "INR",

        razorpayOrderId,

        razorpayPaymentId,

        "SUCCESS",

        new Date().toLocaleString(
          "en-IN"
        ),
      ]);

      // =================================================
      // CREATE NEW SHEET
      // =================================================

      const newWorksheet =
        XLSX.utils.aoa_to_sheet(
          existingData
        );

      workbook.Sheets[
        "Donations"
      ] = newWorksheet;

      // =================================================
      // SAVE EXCEL
      // =================================================

      XLSX.writeFile(
        workbook,
        donationExcelFile
      );

      console.log(
        "Donation saved:",
        donationId
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        message:
          "Donation successfully recorded.",

        donationId,
      });
    } catch (error) {
      console.error(
        "Verify donation error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Payment verified but donation could not be saved.",
      });
    }
  }
);



// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});