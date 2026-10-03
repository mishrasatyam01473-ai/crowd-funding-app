# 🌟 Crowdfunding Platform (Fullstack Web Application)

A modern fullstack crowdfunding web application built with **React 19**, **Vite**, **Express**, **MongoDB**, and **Razorpay**. It enables users to explore causes, create their own fundraising campaigns, accept real-time donations with payment verification, log donation records, track personal campaigns via user dashboards, and submit inquiries.

---

## 🚀 Features

- **Campaign Discovery & Browsing**: View active fundraising campaigns with live progress, creator details, and funding goals.
- **Campaign Creation**: Register new fundraising campaigns with title, descriptions, targets, creator credentials, and images.
- **Secure Razorpay Payment Gateway**: Seamless donation processing with automated client-server order creation, checkout modal, and cryptographically verified payment signatures.
- **Spreadsheet Logging**: Automatically logs every verified donation into Excel (`DonationData.xlsx`) with transaction ID, donor name, timestamp, and status.
- **Inquiry & Support Desk**: User query submission system with automated spreadsheet logging (`QueryData.xlsx`).
- **Creator Dashboard & Auth**: Dedicated login system allowing campaign creators to securely monitor their campaign's raised amount and details.
- **Modern Responsive UI**: Built with modern CSS design tokens, smooth animations, cards, and clean typography.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (Responsive, Modern Design System)
- **Deployment Targets**: Vercel / Netlify

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Payments**: Razorpay SDK
- **Data Export & Logging**: XLSX (SheetJS)
- **Deployment Targets**: Render / Railway / Koyeb

---

## 📁 Repository Structure

```text
crowd-funding-app/
├── backend/
│   ├── .env.example              # Template for backend secrets & config
│   ├── package.json              # Backend dependencies & scripts
│   └── server.js                 # Express server, MongoDB models & API endpoints
├── crowd-funding-app/            # Frontend React application
│   ├── public/                   # Static assets & Netlify _redirects
│   ├── src/
│   │   ├── components/           # Navbar, Footer, IndexPage
│   │   ├── pages/                # DonationForm, QueryForm, CreateProgramme, Login, Dashboard
│   │   ├── config.js             # Dynamic API base URL configuration
│   │   ├── App.jsx               # Client-side router setup
│   │   └── main.jsx
│   ├── .env.example              # Template for frontend environment variables
│   ├── vercel.json               # SPA routing rewrite configuration for Vercel
│   ├── vite.config.js
│   └── package.json
├── data/                         # Directory for generated donation and query spreadsheets
└── .gitignore                    # Git ignore rules for node_modules, .env, and builds
```

---

## 💻 Local Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [Razorpay](https://dashboard.razorpay.com/) test account for payment keys

### 1. Clone the Repository
```bash
git clone https://github.com/mishrasatyam01473-ai/crowd-funding-app.git
cd crowd-funding-app
```

### 2. Configure Backend
1. Open the `backend/` folder:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/crowdfunding
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the backend:
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`.

### 3. Configure Frontend
1. In a new terminal, navigate to `crowd-funding-app/`:
   ```bash
   cd crowd-funding-app
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🌐 Free Cloud Deployment Guide

You can host this entire fullstack application **100% free** using:
- **Database**: MongoDB Atlas (Free M0 Sandbox)
- **Backend**: Render (Free Web Service)
- **Frontend**: Vercel (Free Hobby Plan)

---

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox** cluster.
3. In **Database Access**, create a user with a username and password.
4. In **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/crowdfunding?retryWrites=true&w=majority
   ```

---

### Step 2: Deploy Backend on Render (Free)
1. Sign up / Log in to [Render](https://render.com/) with GitHub.
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository: `crowd-funding-app`.
4. Configure the following fields:
   - **Name**: `crowd-funding-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add:
   - `MONGO_URI`: *(your MongoDB Atlas connection string from Step 1)*
   - `RAZORPAY_KEY_ID`: *(your Razorpay Key ID)*
   - `RAZORPAY_KEY_SECRET`: *(your Razorpay Key Secret)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g. `https://crowd-funding-backend.onrender.com`).

---

### Step 3: Deploy Frontend on Vercel (Free)
1. Sign up / Log in to [Vercel](https://vercel.com/) with GitHub.
2. Click **Add New...** -> **Project** -> Import `crowd-funding-app`.
3. In project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `crowd-funding-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - Key: `VITE_API_URL`
   - Value: `https://crowd-funding-backend.onrender.com` *(your Render backend URL from Step 2)*
5. Click **Deploy**.
6. Vercel will build and provide your live website URL (e.g. `https://crowd-funding-app.vercel.app`)!

> **Optional**: In Render, you can also add `FRONTEND_URL = https://your-vercel-domain.vercel.app` in your backend environment variables to restrict CORS to your production frontend.

---

## 🔒 Security Best Practices
- Never commit actual API keys or `.env` files to GitHub.
- Keep test credentials restricted to test mode in Razorpay.
- Always use environment variables in hosting dashboards.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
