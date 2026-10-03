import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import IndexPage from './components/IndexPage.jsx'
import CreateProgramme from './pages/CreateProgramme.jsx'
import QueryForm from './pages/QueryForm.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DonationForm from './pages/DonationForm.jsx'

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/donate" element={<DonationForm/>} />
        </Routes>

        <Footer />

      </div>
    </BrowserRouter>
  )
}

export default App;
