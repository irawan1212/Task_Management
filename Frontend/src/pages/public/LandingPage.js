
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">
                  Task Management
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Login
                  </Link>
                 
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Task Management</span>
              <span className="block text-blue-600">Made Simple</span>
            </h2>
            <p className="mt-6 text-xl text-gray-500">
              The most effective way to manage your projects, tasks, and teams.
              Stay organized, meet deadlines, and boost productivity.
            </p>
            <div className="mt-10 flex space-x-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </Link>
              <a
                href="#features"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-5">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="px-6 py-8 sm:p-10">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      ✓
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Project Management
                      </h3>
                      <p className="text-sm text-gray-500">
                        Organize tasks and track progress
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      👥
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Team Collaboration
                      </h3>
                      <p className="text-sm text-gray-500">
                        Work together seamlessly
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      📊
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Detailed Reports
                      </h3>
                      <p className="text-sm text-gray-500">
                        Track progress with analytics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Key Features
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Everything you need to manage your projects efficiently.
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 rounded-md bg-blue-500 text-white flex items-center justify-center text-2xl mb-4">
                📁
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Project Management
              </h3>
              <p className="mt-2 text-gray-500">
                Create and organize projects with customizable categories and
                tasks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 rounded-md bg-blue-500 text-white flex items-center justify-center text-2xl mb-4">
                ✓
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Task Tracking
              </h3>
              <p className="mt-2 text-gray-500">
                Assign tasks, set deadlines, and track progress to completion.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 rounded-md bg-blue-500 text-white flex items-center justify-center text-2xl mb-4">
                👥
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Role Management
              </h3>
              <p className="mt-2 text-gray-500">
                Assign appropriate access levels and permissions to team
                members.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 rounded-md bg-blue-500 text-white flex items-center justify-center text-2xl mb-4">
                📊
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Audit Trails
              </h3>
              <p className="mt-2 text-gray-500">
                Track all changes with detailed audit logs for accountability.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 rounded-md bg-blue-500 text-white flex items-center justify-center text-2xl mb-4">
                📁
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                File Attachments
              </h3>
              <p className="mt-2 text-gray-500">
                Attach important documents to your tasks for easy reference.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 rounded-md bg-blue-500 text-white flex items-center justify-center text-2xl mb-4">
                📈
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Import/Export
              </h3>
              <p className="mt-2 text-gray-500">
                Easily import and export data with Excel integration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <h3 className="text-lg font-semibold text-gray-900">
                Task Management
              </h3>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-base text-gray-500">
                &copy; 2025 Task Management. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
