import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  apiLoginUser,
  apiLoginTrainer,
  apiRegisterUser,
  apiRegisterTrainer,
  apiLogoutUser,
  apiLogoutTrainer,
  apiGetUserProfile,
  apiGetTrainerProfile
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

  // Check existing session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      const savedRole = localStorage.getItem('yogazen_role');
      if (!savedRole) {
        setIsLoading(false);
        return;
      }

      try {
        if (savedRole === 'trainer') {
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

  // Logout handler
  const logout = async () => {
    try {
      if (role === 'trainer') {
        await apiLogoutTrainer();
      } else {
        await apiLogoutUser();
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setCurrentUser(null);
      setRole(null);
      localStorage.removeItem('yogazen_user');
      localStorage.removeItem('yogazen_role');
    }
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
    isLoading,
    login,
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
