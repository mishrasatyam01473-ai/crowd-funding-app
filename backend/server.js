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

// --- Middleware & CORS Configuration ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5172",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
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

// --- Health Check Endpoints ---
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Crowdfunding API running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/crowdfunding";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Schemas & Models ---
const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    mailid: { type: String, required: true, trim: true },
    goal: { type: Number, required: true },
    creator: { type: String, required: true, trim: true },
    raised: { type: Number, default: 0 },
    image: { type: String, default: "" },
  },
  { timestamps: true, collection: "campaigns" }
);

const Campaign = mongoose.model("Campaign", campaignSchema);
const CampaignRegistration = Campaign; // Backward compatibility alias

const loginDataSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    mailid: { type: String, required: true, unique: true, trim: true },
    passcode: { type: String, required: true },
    lastLogin: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 0 },
    loginHistory: [
      {
        loginAt: { type: Date, default: Date.now },
        ip: { type: String, default: "" },
        userAgent: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true, collection: "LoginData" }
);

const LoginData = mongoose.model("LoginData", loginDataSchema);

const donationSchema = new mongoose.Schema(
  {
    donationId: { type: String, required: true, unique: true },
    campaignId: { type: String, default: "" },
    creatorName: { type: String, default: "" },
    campaignName: { type: String, default: "" },
    description: { type: String, default: "" },
    donorName: { type: String, required: true },
    donorEmail: { type: String, default: "" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, default: "Razorpay (Online)" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paymentStatus: { type: String, default: "SUCCESS" },
    donationDate: { type: String, default: "" },
  },
  { timestamps: true, collection: "donations" }
);

const Donation = mongoose.model("Donation", donationSchema);

// --- Razorpay Setup ---
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("WARNING: Razorpay credentials are missing in environment variables.");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Data Folder & Excel File Management ---
const DATA_FOLDER =
  process.env.DATA_FOLDER ||
  (fs.existsSync(path.join(__dirname, "..", "data"))
    ? path.join(__dirname, "..", "data")
    : path.join(__dirname, "data"));

try {
  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER, { recursive: true });
  }
} catch (folderErr) {
  console.warn("Notice regarding data folder:", folderErr.message);
}

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
      console.log("DonationData.xlsx initialized successfully.");
    }
  } catch (error) {
    console.error("Error creating DonationData.xlsx:", error);
  }
};

createDonationExcelFile();

const saveDonationToExcel = (record) => {
  try {
    createDonationExcelFile();

    const workbook = fs.existsSync(donationExcelFile)
      ? XLSX.readFile(donationExcelFile)
      : XLSX.utils.book_new();

    const sheetName = "Donations";
    const worksheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
    const existingRows = worksheet ? XLSX.utils.sheet_to_json(worksheet, { defval: "" }) : [];

    const newRow = {
      "Donation ID": record.donationId || `DON-${Date.now()}`,
      "Campaign Name": record.campaignName || "General Campaign",
      "Creator Name": record.creatorName || "Verified Project Lead",
      "Donor Name": record.donorName || "Anonymous",
      "Donor Email": record.donorEmail || "",
      Amount: Number(record.amount || 0),
      Currency: record.currency || "INR",
      "Mode of Payment": record.paymentMethod || "Razorpay (Online)",
      "Date and Time":
        record.donationDate ||
        new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      "Payment Status": record.paymentStatus || "SUCCESS",
      "Campaign ID": record.campaignId || "",
      "Campaign Description": record.description || "",
      "Razorpay Order ID": record.razorpayOrderId || "",
      "Razorpay Payment ID": record.razorpayPaymentId || "",
    };

    existingRows.push(newRow);

    const newWorksheet = XLSX.utils.json_to_sheet(existingRows, { header: donationHeaders });
    workbook.Sheets[sheetName] = newWorksheet;
    if (!workbook.SheetNames.includes(sheetName)) {
      XLSX.utils.book_append_sheet(workbook, newWorksheet, sheetName);
    }

    XLSX.writeFile(workbook, donationExcelFile);
    console.log("Donation recorded in DonationData.xlsx:", record.donationId);
    return true;
  } catch (err) {
    console.error("Error writing to DonationData.xlsx:", err);
    return false;
  }
};

const queryExcelFile = path.join(DATA_FOLDER, "QueryData.xlsx");
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
    const isZeroByte = fileExists && fs.statSync(queryExcelFile).size === 0;

    if (!fileExists || isZeroByte) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([queryHeaders]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Queries");
      XLSX.writeFile(workbook, queryExcelFile);
      console.log("QueryData.xlsx initialized successfully.");
    }
  } catch (error) {
    console.error("Error creating QueryData.xlsx:", error);
  }
};

createQueryExcelFile();

// --- Campaign Endpoints ---
app.get("/api/campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

const handleCampaignRegistration = async (req, res) => {
  try {
    const { title, description, mailid, passcode, goal, creator, image } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ message: "Title required" });
    if (!description || !description.trim()) return res.status(400).json({ message: "Description required" });
    if (!mailid || !mailid.trim()) return res.status(400).json({ message: "Email required" });
    if (!passcode) return res.status(400).json({ message: "Passcode required" });
    if (!goal || isNaN(goal)) return res.status(400).json({ message: "Valid goal amount required" });
    if (!creator || !creator.trim()) return res.status(400).json({ message: "Creator required" });

    const existingLogin = await LoginData.findOne({ mailid: mailid.trim() });
    if (existingLogin) {
      return res.status(400).json({ message: "This email is already registered" });
    }

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

    const newLoginData = new LoginData({
      name: creator ? creator.trim() : "",
      mailid: mailid.trim(),
      passcode,
    });

    const savedLoginData = await newLoginData.save();

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
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Failed to create campaign", error: error.message });
  }
};

app.post("/api/campaignRegistration", handleCampaignRegistration);
app.post("/api/campaigns", handleCampaignRegistration);

// --- User Registration & Authentication Endpoints ---
const handleSignup = async (req, res) => {
  try {
    const { name, mailid, passcode } = req.body;

    if (!mailid || !passcode) {
      return res.status(400).json({ message: "Email and passcode are required" });
    }

    const trimmedEmail = mailid.trim().toLowerCase();
    const trimmedPasscode = String(passcode).trim();
    const trimmedName = (name || "").trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (trimmedPasscode.length < 4) {
      return res.status(400).json({ message: "Passcode must be at least 4 characters long" });
    }

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

    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    const newUser = new LoginData({
      name: trimmedName,
      mailid: trimmedEmail,
      passcode: trimmedPasscode,
      lastLogin: new Date(),
      loginCount: 1,
      loginHistory: [{ loginAt: new Date(), ip: clientIp, userAgent }],
    });

    const savedUser = await newUser.save();

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
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in instead.",
      });
    }
    return res.status(500).json({ message: "Server error during account creation", error: error.message });
  }
};

app.post("/api/signup", handleSignup);
app.post("/api/register", handleSignup);

app.post("/api/login", async (req, res) => {
  try {
    const { mailid, passcode } = req.body;

    if (!mailid || !passcode) {
      return res.status(400).json({ message: "Email and passcode are required" });
    }

    const trimmedEmail = mailid.trim().toLowerCase();
    const trimmedPasscode = String(passcode).trim();
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    let user = await LoginData.findOne({
      $or: [
        { mailid: trimmedEmail },
        { mailid: { $regex: new RegExp(`^${mailid.trim()}$`, "i") } },
      ],
    });

    // Seamless auto-registration if email does not exist yet
    if (!user) {
      if (trimmedPasscode.length < 4) {
        return res.status(400).json({ message: "Passcode must be at least 4 characters long" });
      }

      const newUser = new LoginData({
        name: "",
        mailid: trimmedEmail,
        passcode: trimmedPasscode,
        lastLogin: new Date(),
        loginCount: 1,
        loginHistory: [{ loginAt: new Date(), ip: clientIp, userAgent }],
      });

      const savedUser = await newUser.save();

      return res.status(200).json({
        message: "Login successful! Account registered in LoginData.",
        user: {
          id: savedUser._id,
          mailid: savedUser.mailid,
          name: savedUser.name || "",
        },
      });
    }

    if (user.passcode !== trimmedPasscode) {
      return res.status(401).json({ message: "Invalid email or passcode" });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.push({ loginAt: new Date(), ip: clientIp, userAgent });

    await user.save();

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
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
});

app.get("/api/logindata", async (req, res) => {
  try {
    const users = await LoginData.find({}, { passcode: 0 }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, collection: "LoginData", total: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve LoginData", error: err.message });
  }
});

app.get("/api/user/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

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
      return res.status(404).json({ message: "User not found" });
    }

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
    res.status(500).json({ message: "Failed to fetch user information", error: error.message });
  }
});

// --- Query Form Endpoints ---
app.post("/api/submit-query", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Please enter your full name." });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: "Please enter your email address." });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    if (!subject || !subject.trim()) return res.status(400).json({ success: false, message: "Please specify a subject." });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: "Please enter your message." });

    createQueryExcelFile();

    let workbook;
    try {
      workbook = XLSX.readFile(queryExcelFile);
    } catch {
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

    const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    if (existingData.length === 0) existingData.push(queryHeaders);

    const queryId = `QRY-${Date.now()}`;
    const submittedDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

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

app.get("/api/queries", async (req, res) => {
  try {
    createQueryExcelFile();
    const workbook = XLSX.readFile(queryExcelFile);
    const worksheet = workbook.Sheets["Queries"] || workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return res.status(200).json({ success: true, queries: data });
  } catch (error) {
    console.error("Get queries error:", error);
    return res.status(500).json({ success: false, message: "Could not fetch queries.", error: error.message });
  }
});

// --- Razorpay Payment & Donation Endpoints ---
app.post("/api/create-donation-order", async (req, res) => {
  try {
    let { campaignId, creatorName, campaignName, description, donorName, donorEmail, amount } = req.body;

    if (campaignId && (!campaignName || !creatorName)) {
      try {
        const matched = await Campaign.findById(campaignId);
        if (matched) {
          campaignName = campaignName || matched.title || "";
          creatorName = creatorName || matched.creator || "";
          description = description || matched.description || "";
        }
      } catch (err) {
        console.warn("Notice: campaign lookup warning:", err.message);
      }
    }

    if (!donorName || !donorName.trim()) {
      return res.status(400).json({ success: false, message: "Donor name is required." });
    }

    const donationAmount = Number(amount);
    if (!Number.isFinite(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid donation amount." });
    }

    const amountInPaise = Math.round(donationAmount * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `DON_${Date.now()}`,
      notes: {
        campaignId: String(campaignId || ""),
        campaignName: String(campaignName || ""),
        creatorName: String(creatorName || ""),
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ success: false, message: "Unable to create Razorpay order." });
  }
});

app.post("/api/verify-donation", async (req, res) => {
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

    if (campaignId && (!campaignName || !creatorName)) {
      try {
        const matched = await Campaign.findById(campaignId);
        if (matched) {
          campaignName = campaignName || matched.title || "";
          creatorName = creatorName || matched.creator || "";
          description = description || matched.description || "";
        }
      } catch (err) {
        console.warn("Notice: campaign lookup warning:", err.message);
      }
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Incomplete payment information." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      console.error("Invalid Razorpay signature.");
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

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

    const donationId = `DON-${Date.now()}`;
    const donationDate = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

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
    } catch (mongoErr) {
      console.error("MongoDB donation save warning:", mongoErr.message);
    }

    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { raised: Number(amount) },
      }).catch((err) => console.warn("Notice updating campaign raised:", err.message));
    }

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
    console.error("Verify donation error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verified but donation could not be saved.",
      error: error.message,
    });
  }
});

// --- Strict Donation History Endpoint (User-Specific Filter) ---
app.get("/api/donations", async (req, res) => {
  try {
    const { email } = req.query;
    const queryEmail = (email || "").trim().toLowerCase();

    if (!queryEmail) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required. You can access your own donation history only.",
        donations: [],
        count: 0,
        totalAmount: 0,
      });
    }

    const allRecords = [];

    // Read from DonationData.xlsx
    if (fs.existsSync(donationExcelFile)) {
      try {
        const workbook = XLSX.readFile(donationExcelFile);
        const worksheet = workbook.Sheets["Donations"] || workbook.Sheets[workbook.SheetNames[0]];

        if (worksheet) {
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          rows.forEach((r, idx) => {
            allRecords.push({
              donationId: String(r["Donation ID"] || r.donationId || `DON-${idx}`),
              campaignId: String(r["Campaign ID"] || r.campaignId || ""),
              campaignName: String(r["Campaign Name"] || r.campaignName || "Community Initiative"),
              creatorName: String(r["Creator Name"] || r["Campaign Creator"] || r.creatorName || "Verified Creator"),
              description: String(r["Campaign Description"] || r.description || ""),
              donorName: String(r["Donor Name"] || r.donorName || "Anonymous"),
              donorEmail: String(r["Donor Email"] || r.donorEmail || "").trim().toLowerCase(),
              amount: Number(r["Amount"] || r.amount || 0),
              currency: String(r["Currency"] || r.currency || "INR"),
              paymentMethod: String(r["Mode of Payment"] || r["Payment Method"] || r.paymentMethod || "Razorpay (Online)"),
              razorpayOrderId: String(r["Razorpay Order ID"] || r.razorpayOrderId || ""),
              razorpayPaymentId: String(r["Razorpay Payment ID"] || r.razorpayPaymentId || ""),
              paymentStatus: String(r["Payment Status"] || r.paymentStatus || "SUCCESS"),
              donationDate: String(r["Date and Time"] || r["Donation Date"] || r.donationDate || ""),
            });
          });
        }
      } catch (excelErr) {
        console.warn("Notice reading DonationData.xlsx:", excelErr.message);
      }
    }

    // Read from MongoDB donations collection
    try {
      const mongoDocs = await Donation.find({
        donorEmail: { $regex: new RegExp(`^${queryEmail}$`, "i") },
      }).lean();

      mongoDocs.forEach((md) => {
        allRecords.push({
          donationId: String(md.donationId || md._id),
          campaignId: String(md.campaignId || ""),
          campaignName: String(md.campaignName || "Community Initiative"),
          creatorName: String(md.creatorName || "Verified Creator"),
          description: String(md.description || ""),
          donorName: String(md.donorName || "Anonymous"),
          donorEmail: String(md.donorEmail || "").trim().toLowerCase(),
          amount: Number(md.amount || 0),
          currency: String(md.currency || "INR"),
          paymentMethod: String(md.paymentMethod || "Razorpay (Online)"),
          razorpayOrderId: String(md.razorpayOrderId || ""),
          razorpayPaymentId: String(md.razorpayPaymentId || ""),
          paymentStatus: String(md.paymentStatus || "SUCCESS"),
          donationDate: String(md.donationDate || (md.createdAt ? new Date(md.createdAt).toLocaleString("en-IN") : "")),
        });
      });
    } catch (mongoErr) {
      console.warn("Notice reading MongoDB donations:", mongoErr.message);
    }

    // Deduplicate by donationId
    const recordMap = new Map();
    allRecords.forEach((record) => {
      if (record.donationId && !recordMap.has(record.donationId)) {
        recordMap.set(record.donationId, record);
      }
    });

    // Enforce strict filter: user can access their own donations only
    const userDonations = Array.from(recordMap.values())
      .filter((d) => d.donorEmail === queryEmail)
      .reverse();

    const totalAmount = userDonations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return res.status(200).json({
      success: true,
      donations: userDonations,
      count: userDonations.length,
      totalAmount,
      userEmail: queryEmail,
    });
  } catch (error) {
    console.error("Fetch donations error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch user donation history",
      error: error.message,
    });
  }
});

// --- Server Bootstrap & Keepalive ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  const hostUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (hostUrl) {
    const PING_INTERVAL = 12 * 60 * 1000;
    setInterval(async () => {
      try {
        const pingUrl = `${hostUrl.replace(/\/$/, "")}/health`;
        const response = await fetch(pingUrl);
        console.log(`[KeepAlive] Pinged ${pingUrl} - Status: ${response.status}`);
      } catch (err) {
        console.warn("[KeepAlive] Ping error:", err.message);
      }
    }, PING_INTERVAL);
  }
});