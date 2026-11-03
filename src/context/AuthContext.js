import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  apiLoginUser,
  apiLoginTrainer,
  apiRegisterUser,
  apiRegisterTrainer,
  apiLogoutUser,
  apiLogoutTrainer,
  apiGetUserProfile,
  apiGetTrainerProfile,
  apiGetAdminProfile,
  apiAdminLogin,
  apiAdminLogout
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('yogazen_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('yogazen_role') || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Auth-required Popup Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('Please sign in to continue.');

  const openAuthModal = (reason) => {
    if (reason) setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Listen for background session expiration event
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setRole(null);
    };

    window.addEventListener('yogazen:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('yogazen:auth-expired', handleAuthExpired);
  }, []);

  // Check existing session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      const savedRole = localStorage.getItem('yogazen_role');
      if (!savedRole) {
        setIsLoading(false);
        return;
      }

      try {
        if (savedRole === 'admin' || savedRole === 'superadmin') {
          const res = await apiGetAdminProfile();
          if (res?.admin) {
            setCurrentUser(res.admin);
            setRole(res.admin.role || savedRole);
            localStorage.setItem('yogazen_user', JSON.stringify(res.admin));
          }
        } else if (savedRole === 'trainer') {
          const res = await apiGetTrainerProfile();
          if (res?.trainer) {
            setCurrentUser(res.trainer);
            setRole('trainer');
            localStorage.setItem('yogazen_user', JSON.stringify(res.trainer));
          }
        } else {
          const res = await apiGetUserProfile();
          if (res?.user) {
            setCurrentUser(res.user);
            setRole('user');
            localStorage.setItem('yogazen_user', JSON.stringify(res.user));
          }
        }
      } catch (err) {
        // If cookie expired or invalid, clear stored state
        setCurrentUser(null);
        setRole(null);
        localStorage.removeItem('yogazen_user');
        localStorage.removeItem('yogazen_role');
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  // Login handler: default is user, unless isTrainer === true
  const login = async (email, password, isTrainer = false) => {
    if (isTrainer) {
      const data = await apiLoginTrainer({ email, password });
      const trainerData = { ...data.trainer, role: 'trainer' };
      setCurrentUser(trainerData);
      setRole('trainer');
      localStorage.setItem('yogazen_user', JSON.stringify(trainerData));
      localStorage.setItem('yogazen_role', 'trainer');
      closeAuthModal();
      return trainerData;
    } else {
      const data = await apiLoginUser({ email, password });
      const userData = { ...data.user, role: 'user' };
      setCurrentUser(userData);
      setRole('user');
      localStorage.setItem('yogazen_user', JSON.stringify(userData));
      localStorage.setItem('yogazen_role', 'user');
      closeAuthModal();
      return userData;
    }
  };

  // Register user
  const registerUser = async (email, password) => {
    const data = await apiRegisterUser({ email, password });
    const userData = { ...data.user, role: 'user' };
    setCurrentUser(userData);
    setRole('user');
    localStorage.setItem('yogazen_user', JSON.stringify(userData));
    localStorage.setItem('yogazen_role', 'user');
    return userData;
  };

  // Register trainer
  const registerTrainer = async (email, password) => {
    const data = await apiRegisterTrainer({ email, password });
    const trainerData = { ...data.trainer, role: 'trainer' };
    setCurrentUser(trainerData);
    setRole('trainer');
    localStorage.setItem('yogazen_user', JSON.stringify(trainerData));
    localStorage.setItem('yogazen_role', 'trainer');
    return trainerData;
  };

  // Admin Login handler
  const loginAdmin = async (credentials) => {
    const data = await apiAdminLogin(credentials);
    const adminData = data.admin;
    setCurrentUser(adminData);
    setRole(adminData.role || 'admin');
    localStorage.setItem('yogazen_user', JSON.stringify(adminData));
    localStorage.setItem('yogazen_role', adminData.role || 'admin');
    closeAuthModal();
    return adminData;
  };

  // Logout handler
  const logout = async () => {
    try {
      const payload = {
        email: currentUser?.email,
        role: role || currentUser?.role,
        id: currentUser?._id || currentUser?.id,
        name: currentUser?.name
      };
      if (role === 'admin' || role === 'superadmin') {
        await apiAdminLogout(payload);
      } else if (role === 'trainer') {
        await apiLogoutTrainer(payload);
      } else {
        await apiLogoutUser(payload);
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setCurrentUser(null);
      setRole(null);
      localStorage.removeItem('yogazen_user');
      localStorage.removeItem('yogazen_role');
      localStorage.removeItem('yogazen_token');
    }
  };

  // Check if admin has specific module permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (role === 'superadmin' || currentUser.role === 'superadmin') return true;
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    return perms.includes('all') || perms.includes(permission);
  };

  // Update current user in state & localStorage
  const updateCurrentUser = (updatedData) => {
    setCurrentUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('yogazen_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    currentUser,
    role,
    isLoggedIn: Boolean(currentUser),
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    hasPermission,
    isLoading,
    login,
    loginAdmin,
    registerUser,
    registerTrainer,
    logout,
    updateCurrentUser,
    isAuthModalOpen,
    authModalReason,
    openAuthModal,
    closeAuthModal
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
