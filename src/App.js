import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginModal from './components/LoginModal';

import Home from './pages/Home';
import Products from './pages/Products';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import TrainerRegister from './pages/TrainerRegister';
import TrainerDashboard from './pages/TrainerDashboard';
import UserProfile from './pages/UserProfile';
import TrainerProfile from './pages/TrainerProfile';
import TrainerCourseDetail from './pages/TrainerCourseDetail';
import AdminInventory from './pages/AdminInventory';
import AdminComplaints from './pages/AdminComplaints';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminCRM from './pages/AdminCRM';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminTrainers from './pages/AdminTrainers';
import AdminFinancials from './pages/AdminFinancials';
import AdminSubAdmins from './pages/AdminSubAdmins';
import AdminAuditLogs from './pages/AdminAuditLogs';
import ProductDetail from './pages/ProductDetail';
import OrderSuccess from './pages/OrderSuccess';
import MyLearning from './pages/MyLearning';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartWishlistProvider>
          <NotificationProvider>
            <Router>
            <div className="font-nunito min-h-screen bg-white dark:bg-stone-950 dark:text-stone-100 transition-colors">
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/trainer/register" element={<TrainerRegister />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/orders" element={<UserProfile defaultTab="orders" />} />
              <Route path="/my-orders" element={<UserProfile defaultTab="orders" />} />
              <Route path="/trainer/profile" element={<TrainerProfile />} />
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/courses/:courseId" element={<TrainerCourseDetail />} />
              <Route path="/my-learning" element={<MyLearning />} />
              <Route path="/my-courses" element={<MyLearning />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/crm" element={<AdminCRM />} />
              <Route path="/admin/crm/user/:id" element={<AdminUserDetail />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/trainers" element={<AdminTrainers />} />
              <Route path="/admin/financials" element={<AdminFinancials />} />
              <Route path="/admin/subadmins" element={<AdminSubAdmins />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>

            {/* Global Auth Modal for Protected Actions */}
            <LoginModal />
          </div>
        </Router>
      </NotificationProvider>
    </CartWishlistProvider>
  </AuthProvider>
</ThemeProvider>
  );
}

export default App;
