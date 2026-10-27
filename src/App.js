import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
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
import AdminInventory from './pages/AdminInventory';

function App() {
  return (
    <AuthProvider>
      <CartWishlistProvider>
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
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin" element={<AdminInventory />} />
            </Routes>

            {/* Global Auth Modal for Protected Actions */}
            <LoginModal />
          </div>
        </Router>
      </CartWishlistProvider>
    </AuthProvider>
  );
}

export default App;
