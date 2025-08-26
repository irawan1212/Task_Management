// src/api/axiosTest.js - A test file to verify your axios setup
// This is not a standard part of your app, just for debugging purposes

import api from "./axios";

// Function to test the API client setup
export const testApiClient = () => {
  console.log("Testing API client configuration...");

  // Check environment variables
  console.log(
    "API Base URL:",
    process.env.REACT_APP_API_URL || "Not set (using default)"
  );

  // Check authentication token
  const token = localStorage.getItem("token");
  console.log("Auth token exists:", !!token);
  if (token) {
    console.log("Token first 10 chars:", token.substring(0, 10) + "...");
  }

  // Test a simple request
  console.log("Making a test GET request to /api/health-check...");
  return api
    .get("/health-check")
    .then((response) => {
      console.log("Test request successful:", response.data);
      return {
        success: true,
        data: response.data,
      };
    })
    .catch((error) => {
      console.error("Test request failed:", error);

      // Detailed error reporting
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received. Request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      return {
        success: false,
        error: error.message,
        errorDetails: error.response?.data || {},
      };
    });
};

// Function to manually try the role creation
export const testCreateRole = (roleData) => {
  console.log("Testing role creation with data:", roleData);

  const testData = roleData || {
    name: "Test Role " + new Date().toISOString(),
    description: "A test role created to diagnose API issues",
    permissions: ["view_project", "view_task"],
  };

  return api
    .post("/roles", testData)
    .then((response) => {
      console.log("Role creation test successful:", response.data);
      return {
        success: true,
        data: response.data,
      };
    })
    .catch((error) => {
      console.error("Role creation test failed:", error);

      // Detailed error reporting
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received. Request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      return {
        success: false,
        error: error.message,
        errorDetails: error.response?.data || {},
      };
    });
};
