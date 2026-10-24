import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import LoginModal from './components/LoginModal';

import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import TrainerRegister from './pages/TrainerRegister';
import TrainerDashboard from './pages/TrainerDashboard';
import UserProfile from './pages/UserProfile';
import TrainerProfile from './pages/TrainerProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-nunito min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trainer/register" element={<TrainerRegister />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/trainer/profile" element={<TrainerProfile />} />
            <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
          </Routes>

          {/* Global Auth Modal for Protected Actions */}
          <LoginModal />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
