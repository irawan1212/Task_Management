import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({
    create: false,
    read: false,
    update: false,
    delete: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await api.get("/user");
          setUser(response.data);

          // Minimal fallback permissions
          const fallbackPermissions = {
            create: false,
            read: false,
            update: false,
            delete: false,
          };

          // Normalize role name (handle typos like "Manger")
      
          // Use API permissions if valid, otherwise fallback
          const userPermissions =
            response.data.permissions &&
            typeof response.data.permissions === "object" &&
            Object.keys(response.data.permissions).length > 0
              ? response.data.permissions
              : fallbackPermissions;

          setPermissions(userPermissions);
          console.log("User authenticated:", response.data);
          console.log("Permissions set:", userPermissions);
        } catch (err) {
          console.error("Authentication check failed:", err);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
        }
      } else {
        console.log("No token found in localStorage");
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      console.log("Attempting login with:", { email });
      const response = await api.post("/login", { email, password });
      console.log("Login response:", response.data);

      const { token, user } = response.data;

      if (!token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const fallbackPermissions = {
        create: false,
        read: false,
        update: false,
        delete: false,
      };

     
      const userPermissions =
        user.permissions &&
        typeof user.permissions === "object" &&
        Object.keys(user.permissions).length > 0
          ? user.permissions
          : fallbackPermissions;

      setUser(user);
      setPermissions(userPermissions);
      return user;
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = err.response?.data?.message || "Failed to login";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const register = async (userData) => {
    setError("");
    try {
      console.log("Attempting registration:", userData);
      const response = await api.post("/register", userData);
      console.log("Registration response:", response.data);

      const { user, token } = response.data;

      if (!token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const fallbackPermissions = {
        create: false,
        read: false,
        update: false,
        delete: false,
      };

       const userPermissions =
        user.permissions &&
        typeof user.permissions === "object" &&
        Object.keys(user.permissions).length > 0
          ? user.permissions
          : fallbackPermissions;

      setUser(user);
      setPermissions(userPermissions);
      return user;
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.message || "Failed to register";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      if (api.defaults.headers.common["Authorization"]) {
        await api.post("/logout");
        console.log("Logout successful");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setPermissions({
        create: false,
        read: false,
        update: false,
        delete: false,
      });
    }
  };

  const isAdmin = () => user?.role === "Administrator";

  const hasPermission = (permission) => {
    return permissions[permission] || isAdmin();
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
