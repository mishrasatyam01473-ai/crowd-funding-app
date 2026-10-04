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
    message: "Crowdfunding API running",
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
// CAMPAIGNS SCHEMA & MODEL
// Explicitly stores campaign data in the "campaigns" collection
// ==========================================

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    mailid: {
      type: String,
      required: true,
      trim: true,
    },

    goal: {
      type: Number,
      required: true,
    },

    creator: {
      type: String,
      required: true,
      trim: true,
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
    collection: "campaigns",
  }
);

// Primary Campaign Model targeting "campaigns" collection
const Campaign = mongoose.model("Campaign", campaignSchema);

// Backward-compatible alias ensuring any existing references target the "campaigns" collection
const CampaignRegistration = Campaign;

// ==========================================
// LOGIN DATA SCHEMA
// This collection will ONLY store email/passcode
// ==========================================

const LoginDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

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

    lastLogin: {
      type: Date,
      default: Date.now,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    loginHistory: [
      {
        loginAt: {
          type: Date,
          default: Date.now,
        },
        ip: {
          type: String,
          default: "",
        },
        userAgent: {
          type: String,
          default: "",
        },
      },
    ],
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
// DONATION SCHEMA & MODEL
// ==========================================

const DonationSchema = new mongoose.Schema(
  {
    donationId: {
      type: String,
      required: true,
      unique: true,
    },
    campaignId: {
      type: String,
      default: "",
    },
    creatorName: {
      type: String,
      default: "",
    },
    campaignName: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    donorName: {
      type: String,
      required: true,
    },
    donorEmail: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMethod: {
      type: String,
      default: "Razorpay (Online)",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      default: "SUCCESS",
    },
    donationDate: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "donations",
  }
);

const Donation = mongoose.model("Donation", DonationSchema);

// ==========================================
// GET CAMPAIGNS
// Fetches all campaigns stored in the "campaigns" collection
// ==========================================

app.get("/api/campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });

    console.log(`Campaigns fetched successfully (${campaigns.length} total)`);

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
// CREATE CAMPAIGN HANDLER
// Stores new campaign into "campaigns" collection
// and user credentials into "LoginData" collection
// ==========================================

const handleCampaignRegistration = async (req, res) => {
  try {
    console.log("================================");
    console.log("Campaign registration data received:");
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

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Title required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Description required",
      });
    }

    if (!mailid || !mailid.trim()) {
      return res.status(400).json({
        message: "Email required",
      });
    }

    if (!passcode) {
      return res.status(400).json({
        message: "Passcode required",
      });
    }

    if (!goal || isNaN(goal)) {
      return res.status(400).json({
        message: "Valid goal amount required",
      });
    }

    if (!creator || !creator.trim()) {
      return res.status(400).json({
        message: "Creator required",
      });
    }

    // ==========================================
    // CHECK IF EMAIL ALREADY EXISTS
    // ==========================================

    const existingLogin = await LoginData.findOne({
      mailid: mailid.trim(),
    });

    if (existingLogin) {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    // ==========================================
    // SAVE CAMPAIGN DATA DIRECTLY TO "campaigns" COLLECTION
    // ==========================================

    const newCampaign = new Campaign({
      title: title.trim(),
      description: description.trim(),
      mailid: mailid.trim(),
      goal: Number(goal),
      creator: creator.trim(),
      raised: 0,
      image: image ? image.trim() : "",
    });

    const savedCampaign = await newCampaign.save();

    console.log("Campaign saved successfully into MongoDB 'campaigns' collection:");
    console.log(savedCampaign);

    // ==========================================
    // SAVE LOGIN DATA
    // ==========================================

    const newLoginData = new LoginData({
      name: creator ? creator.trim() : "",
      mailid: mailid.trim(),
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
        name: savedLoginData.name || "",
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
};

app.post("/api/campaignRegistration", handleCampaignRegistration);
app.post("/api/campaigns", handleCampaignRegistration);

// ==========================================
// SIGNUP / REGISTRATION API
// Creates an account directly without requiring a campaign
// ==========================================

const handleSignup = async (req, res) => {
  try {
    const { name, mailid, passcode } = req.body;

    console.log("Signup attempt for email:", mailid);

    // Validate inputs
    if (!mailid || !passcode) {
      return res.status(400).json({
        message: "Email and passcode are required",
      });
    }

    const trimmedEmail = mailid.trim().toLowerCase();
    const trimmedPasscode = String(passcode).trim();
    const trimmedName = (name || "").trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (trimmedPasscode.length < 4) {
      return res.status(400).json({
        message: "Passcode must be at least 4 characters long",
      });
    }

    // Check if an account with this email already exists
    const existingUser = await LoginData.findOne({
      $or: [
        { mailid: trimmedEmail },
        { mailid: { $regex: new RegExp(`^${mailid.trim()}$`, "i") } },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in instead.",
      });
    }

    // Create and save new user in MongoDB LoginData collection
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    const newUser = new LoginData({
      name: trimmedName,
      mailid: trimmedEmail,
      passcode: trimmedPasscode,
      lastLogin: new Date(),
      loginCount: 1,
      loginHistory: [
        {
          loginAt: new Date(),
          ip: clientIp,
          userAgent: userAgent,
        },
      ],
    });

    const savedUser = await newUser.save();

    console.log("New user registered successfully into MongoDB LoginData collection:");
    console.log({
      id: savedUser._id,
      name: savedUser.name,
      mailid: savedUser.mailid,
      createdAt: savedUser.createdAt,
    });

    return res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: savedUser._id,
        mailid: savedUser.mailid,
        name: savedUser.name || "",
      },
    });

  } catch (error) {
    console.error("Signup error:", error);

    // Duplicate key error in MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in instead.",
      });
    }

    return res.status(500).json({
      message: "Server error during account creation",
      error: error.message,
    });
  }
};

app.post("/api/signup", handleSignup);
app.post("/api/register", handleSignup);

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

    const trimmedEmail = mailid.trim().toLowerCase();
    const trimmedPasscode = String(passcode).trim();
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    // Find email (case-insensitive lookup)
    let user = await LoginData.findOne({
      $or: [
        { mailid: trimmedEmail },
        { mailid: { $regex: new RegExp(`^${mailid.trim()}$`, "i") } },
      ],
    });

    // If the user doesn't exist yet in LoginData, auto-register them seamlessly so their login/sign data is saved
    if (!user) {
      if (trimmedPasscode.length < 4) {
        return res.status(400).json({
          message: "Passcode must be at least 4 characters long",
        });
      }

      const newUser = new LoginData({
        name: "",
        mailid: trimmedEmail,
        passcode: trimmedPasscode,
        lastLogin: new Date(),
        loginCount: 1,
        loginHistory: [
          {
            loginAt: new Date(),
            ip: clientIp,
            userAgent: userAgent,
          },
        ],
      });

      const savedUser = await newUser.save();
      console.log("New user auto-created via login in MongoDB LoginData:", savedUser._id, savedUser.mailid);

      return res.status(200).json({
        message: "Login successful! Account registered in LoginData.",
        user: {
          id: savedUser._id,
          mailid: savedUser.mailid,
          name: savedUser.name || "",
        },
      });
    }

    // Check passcode for existing user
    if (user.passcode !== trimmedPasscode) {
      return res.status(401).json({
        message: "Invalid email or passcode",
      });
    }

    // Update login tracking data in LoginData collection
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.push({
      loginAt: new Date(),
      ip: clientIp,
      userAgent: userAgent,
    });

    await user.save();

    console.log("Login data updated in MongoDB LoginData for user:", user.mailid, "Count:", user.loginCount);

    // Login successful
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        mailid: user.mailid,
        name: user.name || "",
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

// ==========================================
// GET LOGINDATA (View all accounts in LoginData collection)
// ==========================================
app.get("/api/logindata", async (req, res) => {
  try {
    const users = await LoginData.find({}, { passcode: 0 }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      collection: "LoginData",
      total: users.length,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve LoginData",
      error: err.message,
    });
  }
});


// ==========================================
// GET USER DASHBOARD
// ==========================================
app.get("/api/user/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Find user by MongoDB _id (if valid ObjectId) or by email
    let user = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await LoginData.findById(identifier);
    }
    if (!user) {
      user = await LoginData.findOne({
        $or: [
          { mailid: identifier.trim().toLowerCase() },
          { mailid: { $regex: new RegExp(`^${identifier.trim()}$`, "i") } },
        ],
      });
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Find campaign associated with this user's mailid from "campaigns" collection
    const campaign = await Campaign.findOne({
      mailid: { $regex: new RegExp(`^${user.mailid.trim()}$`, "i") },
    });

    res.status(200).json({
      user: {
        id: user._id,
        mailid: user.mailid,
        name: user.name || "",
      },
      campaign: campaign || null,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Failed to fetch user information",
      error: error.message,
    });
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
// DONATION EXCEL FILE & HEADERS
// Explicitly stores: Campaign Name, Creator Name, Donor Name,
// Donor Email, Amount, Date and Time, Mode of Payment
// =====================================================

const donationExcelFile = path.join(DATA_FOLDER, "DonationData.xlsx");

const donationHeaders = [
  "Donation ID",
  "Campaign Name",
  "Creator Name",
  "Donor Name",
  "Donor Email",
  "Amount",
  "Currency",
  "Mode of Payment",
  "Date and Time",
  "Payment Status",
  "Campaign ID",
  "Campaign Description",
  "Razorpay Order ID",
  "Razorpay Payment ID",
];

const createDonationExcelFile = () => {
  try {
    if (!fs.existsSync(donationExcelFile)) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([donationHeaders]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
      XLSX.writeFile(workbook, donationExcelFile);
      console.log("DonationData.xlsx created successfully with updated headers.");
    }
  } catch (error) {
    console.error("Error creating Excel file:", error);
  }
};

createDonationExcelFile();

// =====================================================
// APPEND DONATION RECORD TO DONATIONDATA.XLSX
// =====================================================

const saveDonationToExcel = (record) => {
  try {
    createDonationExcelFile();

    let workbook;
    if (fs.existsSync(donationExcelFile)) {
      workbook = XLSX.readFile(donationExcelFile);
    } else {
      workbook = XLSX.utils.book_new();
    }

    const sheetName = "Donations";
    const worksheet =
      workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];

    let existingRows = [];
    if (worksheet) {
      existingRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    }

    const newRow = {
      "Donation ID": record.donationId || `DON-${Date.now()}`,
      "Campaign Name": record.campaignName || "General Campaign",
      "Creator Name": record.creatorName || "Verified Project Lead",
      "Donor Name": record.donorName || "Anonymous",
      "Donor Email": record.donorEmail || "",
      "Amount": Number(record.amount || 0),
      "Currency": record.currency || "INR",
      "Mode of Payment": record.paymentMethod || "Razorpay (Online)",
      "Date and Time": record.donationDate || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      "Payment Status": record.paymentStatus || "SUCCESS",
      "Campaign ID": record.campaignId || "",
      "Campaign Description": record.description || "",
      "Razorpay Order ID": record.razorpayOrderId || "",
      "Razorpay Payment ID": record.razorpayPaymentId || "",
    };

    existingRows.push(newRow);

    const newWorksheet = XLSX.utils.json_to_sheet(existingRows, {
      header: donationHeaders,
    });

    workbook.Sheets[sheetName] = newWorksheet;
    if (!workbook.SheetNames.includes(sheetName)) {
      XLSX.utils.book_append_sheet(workbook, newWorksheet, sheetName);
    }

    XLSX.writeFile(workbook, donationExcelFile);
    console.log("Donation successfully appended to DonationData.xlsx:", record.donationId);
    return true;
  } catch (err) {
    console.error("Error appending to DonationData.xlsx:", err);
    return false;
  }
};

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
      let {
        campaignId,
        creatorName,
        campaignName,
        description,
        donorName,
        donorEmail,
        amount,
      } = req.body;

      // Auto-resolve campaign and creator from MongoDB if missing
      if (campaignId && (!campaignName || !creatorName)) {
        try {
          const matchedCampaign = await Campaign.findById(campaignId);
          if (matchedCampaign) {
            campaignName = campaignName || matchedCampaign.title || "";
            creatorName = creatorName || matchedCampaign.creator || "";
            description = description || matchedCampaign.description || "";
          }
        } catch (cErr) {
          console.warn("Notice: campaign lookup warning:", cErr.message);
        }
      }

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
      let {
        campaignId,
        creatorName,
        campaignName,
        description,
        donorName,
        donorEmail,
        amount,

        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body;

      // Auto-resolve campaign and creator from MongoDB if missing
      if (campaignId && (!campaignName || !creatorName)) {
        try {
          const matchedCampaign = await Campaign.findById(campaignId);
          if (matchedCampaign) {
            campaignName = campaignName || matchedCampaign.title || "";
            creatorName = creatorName || matchedCampaign.creator || "";
            description = description || matchedCampaign.description || "";
          }
        } catch (cErr) {
          console.warn("Notice: campaign lookup warning:", cErr.message);
        }
      }

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
      // DETERMINE PAYMENT METHOD FROM RAZORPAY
      // =================================================

      let paymentMethod = "Razorpay (Online)";
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
        if (paymentDetails && paymentDetails.method) {
          const methodType = String(paymentDetails.method).toUpperCase();
          if (methodType === "UPI") {
            paymentMethod = paymentDetails.vpa ? `UPI (${paymentDetails.vpa})` : "UPI";
          } else if (methodType === "CARD") {
            const cardNetwork = paymentDetails.card?.network || "Card";
            const last4 = paymentDetails.card?.last4 ? ` ****${paymentDetails.card.last4}` : "";
            paymentMethod = `${cardNetwork}${last4}`;
          } else if (methodType === "NETBANKING") {
            paymentMethod = paymentDetails.bank ? `Net Banking (${paymentDetails.bank})` : "Net Banking";
          } else if (methodType === "WALLET") {
            paymentMethod = paymentDetails.wallet ? `Wallet (${paymentDetails.wallet})` : "Wallet";
          } else {
            paymentMethod = methodType;
          }
        }
      } catch (methodErr) {
        console.warn("Notice: Default payment method used:", methodErr.message);
      }

      // =================================================
      // GENERATE DONATION ID & FORMATTED DATE
      // =================================================

      const donationId = `DON-${Date.now()}`;
      const donationDate = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      // =================================================
      // SAVE TO MONGODB
      // =================================================

      let savedDonationDoc = null;
      try {
        const newDonation = new Donation({
          donationId,
          campaignId: campaignId || "",
          creatorName: creatorName || "",
          campaignName: campaignName || "",
          description: description || "",
          donorName: donorName ? donorName.trim() : "Anonymous",
          donorEmail: donorEmail ? donorEmail.trim() : "",
          amount: Number(amount),
          currency: "INR",
          paymentMethod,
          razorpayOrderId,
          razorpayPaymentId,
          paymentStatus: "SUCCESS",
          donationDate,
        });

        savedDonationDoc = await newDonation.save();
        console.log("Donation saved to MongoDB:", donationId);
      } catch (mongoErr) {
        console.error("MongoDB donation save warning:", mongoErr.message);
      }

      // Update campaign raised total in "campaigns" collection if valid campaignId
      if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: { raised: Number(amount) },
        }).catch((err) => console.warn("Notice updating campaign raised:", err.message));
      }

      // =================================================
      // SAVE DIRECTLY TO DONATIONDATA.XLSX
      // =================================================

      saveDonationToExcel({
        donationId,
        campaignId,
        creatorName,
        campaignName,
        description,
        donorName: donorName ? donorName.trim() : "Anonymous",
        donorEmail: donorEmail ? donorEmail.trim() : "",
        amount: Number(amount),
        currency: "INR",
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: "SUCCESS",
        donationDate,
      });

      return res.status(200).json({
        success: true,
        message: "Donation successfully recorded.",
        donationId,
        donation: savedDonationDoc,
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
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET DONATIONS (DONATION HISTORY FROM EXCEL ONLY)
// =====================================================

app.get("/api/donations", async (req, res) => {
  try {
    const { email, donorName } = req.query;

    // Security & Privacy requirement: User can access THEIR OWN donation history only
    const queryEmail = (email || "").trim().toLowerCase();
    const queryName = (donorName || "").trim().toLowerCase();

    if (!queryEmail && !queryName) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required. You can only view your own donation history.",
        donations: [],
        count: 0,
        totalAmount: 0,
      });
    }

    if (!fs.existsSync(donationExcelFile)) {
      return res.status(200).json({
        success: true,
        source: "DonationData.xlsx",
        donations: [],
        count: 0,
        totalAmount: 0,
      });
    }

    const workbook = XLSX.readFile(donationExcelFile);
    const worksheet =
      workbook.Sheets["Donations"] ||
      workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      return res.status(200).json({
        success: true,
        source: "DonationData.xlsx",
        donations: [],
        count: 0,
        totalAmount: 0,
      });
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Normalize records read directly from DonationData.xlsx
    const normalized = rows.map((r, idx) => ({
      donationId: r["Donation ID"] || r.donationId || `DON-${idx}`,
      campaignId: r["Campaign ID"] || r.campaignId || "",
      campaignName: r["Campaign Name"] || r.campaignName || "Community Initiative",
      creatorName: r["Creator Name"] || r["Campaign Creator"] || r.creatorName || "Verified Creator",
      description: r["Campaign Description"] || r.description || "",
      donorName: r["Donor Name"] || r.donorName || "Anonymous",
      donorEmail: r["Donor Email"] || r.donorEmail || "",
      amount: Number(r["Amount"] || r.amount || 0),
      currency: r["Currency"] || r.currency || "INR",
      paymentMethod: r["Mode of Payment"] || r["Payment Method"] || r.paymentMethod || "Razorpay (Online)",
      razorpayOrderId: r["Razorpay Order ID"] || r.razorpayOrderId || "",
      razorpayPaymentId: r["Razorpay Payment ID"] || r.razorpayPaymentId || "",
      paymentStatus: r["Payment Status"] || r.paymentStatus || "SUCCESS",
      donationDate: r["Date and Time"] || r["Donation Date"] || r.donationDate || "",
    }));

    // Filter strictly for the requesting user's donations
    let userDonations = normalized.filter((d) => {
      const dEmail = (d.donorEmail || "").toLowerCase();
      const dName = (d.donorName || "").toLowerCase();

      if (queryEmail) {
        if (dEmail === queryEmail) return true;
        if (dName === queryEmail) return true;
        if (queryEmail.includes("@") && dName === queryEmail.split("@")[0]) return true;
      }
      if (queryName && dName === queryName) {
        return true;
      }
      return false;
    });

    // Sort newest first
    userDonations = userDonations.reverse();

    const totalAmount = userDonations.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );

    return res.status(200).json({
      success: true,
      source: "DonationData.xlsx",
      donations: userDonations,
      count: userDonations.length,
      totalAmount,
    });
  } catch (error) {
    console.error("Fetch donations error from DonationData.xlsx:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch donation history from DonationData.xlsx",
      error: error.message,
    });
  }
});



// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Auto keep-alive ping to prevent sleep on free hosting (Render / Railway)
  const hostUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (hostUrl) {
    const PING_INTERVAL = 12 * 60 * 1000; // Ping every 12 minutes (before the 15-min timeout)
    setInterval(async () => {
      try {
        const pingUrl = `${hostUrl.replace(/\/$/, "")}/health`;
        const res = await fetch(pingUrl);
        console.log(`[KeepAlive] Pinged ${pingUrl} - Status: ${res.status}`);
      } catch (err) {
        console.warn(`[KeepAlive] Ping error:`, err.message);
      }
    }, PING_INTERVAL);
  }
});