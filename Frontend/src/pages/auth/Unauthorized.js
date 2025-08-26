// src/pages/auth/Unauthorized.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Card from "../../components/common/Card";

const Unauthorized = () => {
  const location = useLocation();
  const message =
    location.state?.message || "You don't have permission to access this page.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg">
        <Card>
          <div className="p-6">
            <div className="flex flex-col items-center">
              <div className="mb-4 text-red-500">
                <svg
                  className="h-16 w-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 text-center mb-6">{message}</p>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Log In Again
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Unauthorized;
