# Crowdfunding Web Application

A full-stack crowdfunding platform where users can browse community campaigns, launch fundraising programs, and contribute donations with verified Razorpay payment integration.

---

## Overview

This project was built to provide an end-to-end fundraising system. Users can explore campaigns, make donations using Razorpay test/live gateway, and receive instant verification. Campaign creators can register their initiatives, log in, and track contributions via their personal dashboard. An inquiry desk is also included with automated spreadsheet recording for inquiries and transactions.

---

## Key Features

- **Campaign Discovery**: Browse active campaigns with details on fundraising goals, creators, and progress.
- **Campaign Registration**: Creators can submit new campaigns with funding targets, descriptions, and banner images.
- **Razorpay Payments**: Complete donation flow with server-side order generation and cryptographic payment signature verification (`crypto` HMAC SHA256).
- **Data Export & Audit**: Automatic record keeping in Excel (`DonationData.xlsx` and `QueryData.xlsx`) alongside MongoDB collections.
- **Creator Dashboard**: Password-protected portal for campaign owners to view their campaign metrics.
- **Support & Inquiries**: Contact form for donor questions and support requests.

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router v7, Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Payments**: Razorpay Node SDK & Checkout modal
- **Utilities**: SheetJS (`xlsx`) for data auditing, `cors`, `dotenv`

---

## Project Structure

```text
├── backend/
│   ├── .env.example        # Environment variable template
│   ├── package.json        # Backend dependencies & scripts
│   └── server.js           # Express app, Mongoose schemas, Razorpay routes
├── crowd-funding-app/      # React Vite frontend
│   ├── src/
│   │   ├── components/     # Navbar, Footer, IndexPage
│   │   ├── pages/          # DonationForm, QueryForm, CreateProgramme, Login, Dashboard
│   │   ├── config.js       # Dynamic API base URL resolver
│   │   └── App.jsx         # Route declarations
│   ├── public/             # Static assets & redirect rules
│   ├── vercel.json         # SPA rewrite rules for Vercel
│   └── package.json
├── data/                   # Directory where Excel donation/query records are stored
├── .gitignore
├── LICENSE
└── README.md
```

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check endpoint |
| `GET` | `/health` | API status and server timestamp |
| `GET` | `/api/campaigns` | Returns list of all registered campaigns |
| `POST` | `/api/campaignRegistration` | Creates a new fundraising campaign and user login record |
| `POST` | `/api/login` | Authenticates a campaign creator |
| `GET` | `/api/user/:mailid` | Retrieves creator details and linked campaign data |
| `POST` | `/api/create-donation-order` | Generates a Razorpay payment order ID |
| `POST` | `/api/verify-donation` | Verifies payment signature and records donation to Excel |
| `POST` | `/api/submit-query` | Saves user support inquiry to Excel |
| `GET` | `/api/queries` | Fetches submitted inquiries list |

---

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB instance (local or MongoDB Atlas connection string)
- Razorpay account (test mode credentials)

### 1. Clone the repo

```bash
git clone https://github.com/mishrasatyam01473-ai/crowd-funding-app.git
cd crowd-funding-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/crowdfunding
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm start
```

### 3. Frontend Setup

In a new terminal window:

```bash
cd crowd-funding-app
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and connect to the backend on port 5000 by default.

---

## Testing Payments (Razorpay Test Mode)

To test donations without real money:
1. Make sure your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are from the **Test Mode** tab in your Razorpay Dashboard.
2. When the checkout modal opens, use any test card details provided in the [Razorpay Test Cards documentation](https://razorpay.com/docs/payments/payments/test-card-details/).
3. Use any 4-digit OTP (e.g., `1234`) on the mock bank authentication screen.

---

## Deployment

### Backend (Render)
1. Link your GitHub repository to [Render](https://render.com/).
2. Create a new **Web Service** with:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
3. Add the following environment variables in Render:
   - `MONGO_URI`: Your MongoDB Atlas URI
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
   - `NODE_ENV`: `production`

### Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com/).
2. Configure settings:
   - Root Directory: `crowd-funding-app`
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variable:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://your-backend.onrender.com`)
4. Deploy. The included `vercel.json` ensures client-side routing works on page refreshes.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by [Satyam Mishra](https://github.com/mishrasatyam01473-ai).
