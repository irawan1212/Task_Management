// src/services/authService.js
import axios from "axios";

const API_URL = "http://localhost:8000/api";
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getAuthUser = () => {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const isAdmin = () => {
  const user = getAuthUser();
  return user && user.role === "Administrator";
};

export const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = getAuthToken();

      if (token) {
        await axios
          .post(
            `${API_URL}/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          )
          .catch(() => {
            // Ignore errors on logout
          });
      }

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      // Ignore errors on logout, just clear localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  checkAuth: async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        return null;
      }

      const response = await axios.get(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const user = response.data;
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      // If auth check fails, clear storage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
};
