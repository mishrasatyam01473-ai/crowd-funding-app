import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import IndexPage from './components/IndexPage.jsx'
import CreateProgramme from './pages/CreateProgramme.jsx'
import QueryForm from './pages/QueryForm.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DonationForm from './pages/DonationForm.jsx'
import DonationHistory from './pages/DonationHistory.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="mainPage">

        <Navbar />

        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/create-programme" element={<CreateProgramme />} />
          <Route path="/query-form" element={<QueryForm />} />
          <Route path="/user-login" element={<Login />} />
          <Route path="/login" element={<Navigate to="/user-login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/donate" element={<DonationForm />} />
          <Route path="/donation-history" element={<DonationHistory />} />
          <Route path="/my-donations" element={<Navigate to="/donation-history" replace />} />
        </Routes>

        <Footer />

      </div>
    </BrowserRouter>
  )
}

export default App;
