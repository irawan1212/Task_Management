// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

export const attachmentBaseURL =
   "http://localhost:8000";

api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log("API Request:", {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        params: config.params,
        headers: {
          ContentType: config.headers["Content-Type"],
          Accept: config.headers.Accept,
          Authorization: config.headers.Authorization
            ? "Bearer [FILTERED]"
            : undefined,
        },
        dataType: config.data
          ? config.data instanceof FormData
            ? "FormData"
            : typeof config.data
          : "none",
      });
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
        dataPreview:
          response.config.headers["Content-Type"] === "multipart/form-data"
            ? "File data received"
            : typeof response.data === "object"
            ? "Object data received"
            : `${typeof response.data} received`,
      });
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("API Response Error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });

      switch (error.response.status) {
        case 401:
          console.log("Authentication error, redirecting to login...");
          localStorage.removeItem("token");
          window.location.href = "/login";
          break;

        case 403:
          console.error("Permission denied");
          break;

        case 422:
          console.error(
            "Validation errors:",
            error.response.data.errors || error.response.data
          );
          break;

        case 500:
          console.error("Server error occurred:", error.response.data);
          break;

        default:
          console.error(`Error ${error.response.status}:`, error.response.data);
      }
    } else if (error.request) {
      console.error("No response received:", {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        errorMessage: error.message,
      });
    } else {
      console.error("Request configuration error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
