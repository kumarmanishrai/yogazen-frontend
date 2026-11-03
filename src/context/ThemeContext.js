import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const applyThemeToDOM = (t) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;
    if (t === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }
};

export const ThemeProvider = ({ children }) => {
  // Light theme is strictly default per requirements
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('yogazen_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    }
    return 'light';
  });

  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('yogazen_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyThemeToDOM(next);
      try {
        localStorage.setItem('yogazen_theme', next);
      } catch (e) {}
      return next;
    });
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      applyThemeToDOM(newTheme);
      setThemeState(newTheme);
      try {
        localStorage.setItem('yogazen_theme', newTheme);
      } catch (e) {}
    }
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
