import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const authService = {
  async login(email, password) {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  async register(name, email, password, passwordConfirmation) {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem("user");
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
  },

  async fetchUserProfile() {
    const user = this.getCurrentUser();
    if (user && user.token) {
      const response = await axios.get(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return response.data;
    }
    return null;
  },
};
