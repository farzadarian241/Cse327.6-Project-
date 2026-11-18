"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState("BUYER");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  // Function to refresh current user and unread notifications from /api/auth/me
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          setActiveRole(data.user.active_role || "BUYER");
          if (typeof data.unreadNotifications === "number") {
            setUnreadNotifications(data.unreadNotifications);
          }
          try {
            localStorage.setItem("haatbodol_user", JSON.stringify(data.user));
            localStorage.setItem("haatbodol_role", data.user.active_role || "BUYER");
          } catch {}
          return data.user;
        } else {
          setUser(null);
          setActiveRole("BUYER");
          setUnreadNotifications(0);
          try {
            localStorage.removeItem("haatbodol_user");
            localStorage.removeItem("haatbodol_role");
          } catch {}
          return null;
        }
      } else {
        setUser(null);
        setActiveRole("BUYER");
        setUnreadNotifications(0);
        try {
          localStorage.removeItem("haatbodol_user");
          localStorage.removeItem("haatbodol_role");
        } catch {}
        return null;
      }
    } catch (err) {
      console.warn("Could not fetch /api/auth/me:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, load session from /api/auth/me
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("haatbodol_user");
      const savedRole = localStorage.getItem("haatbodol_role");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setActiveRole(savedRole || parsed.active_role || "BUYER");
      }
    } catch {}

    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.message || data.error || "Login failed. Please check your credentials.",
        };
      }
      if (data.user) {
        setUser(data.user);
        setActiveRole(data.user.active_role || "BUYER");
        try {
          localStorage.setItem("haatbodol_user", JSON.stringify(data.user));
          localStorage.setItem("haatbodol_role", data.user.active_role || "BUYER");
        } catch {}
      }
      // Re-fetch notifications
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (typeof meData.unreadNotifications === "number") {
            setUnreadNotifications(meData.unreadNotifications);
          }
        }
      } catch {}

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message || "Network error. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.message || data.error || "Registration failed. Please check the form.",
        };
      }
      if (data.user) {
        setUser(data.user);
        setActiveRole(data.user.active_role || "BUYER");
        try {
          localStorage.setItem("haatbodol_user", JSON.stringify(data.user));
          localStorage.setItem("haatbodol_role", data.user.active_role || "BUYER");
        } catch {}
      }
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message || "Network error. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    setUser(null);
    setActiveRole("BUYER");
    setUnreadNotifications(0);
    try {
      localStorage.removeItem("haatbodol_user");
      localStorage.removeItem("haatbodol_role");
    } catch {}
    setLoading(false);
  };

  // Switch role handler (BUYER <-> SELLER)
  const switchRole = async (targetRole) => {
    const nextRole = targetRole || (activeRole === "BUYER" ? "SELLER" : "BUYER");
    setActiveRole(nextRole);
    setUser((prev) => (prev ? { ...prev, active_role: nextRole } : prev));
    try {
      localStorage.setItem("haatbodol_role", nextRole);
      const res = await fetch("/api/auth/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setActiveRole(data.user.active_role || nextRole);
          try {
            localStorage.setItem("haatbodol_user", JSON.stringify(data.user));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Failed to persist role switch on server:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        unreadNotifications,
        loading,
        isCampusVerified: Boolean(user?.is_campus_verified),
        login,
        register,
        logout,
        switchRole,
        refreshUser,
        setUser,
        setUnreadNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
