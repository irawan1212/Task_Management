// src/pages/roles/RoleList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { roleService } from "../../api/services";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import SuccessAlert from "../../components/common/SuccessAlert";
import ErrorAlert from "../../components/common/ErrorAlert";

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    sort_by: "name",
    sort_direction: "asc",
    per_page: 10,
  });

  useEffect(() => {
    fetchRoles();
  }, [filters]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAll(filters);

      // Check the structure of the response
      if (response && response.data) {
        // Check if data is directly the array or nested under a "data" property
        if (Array.isArray(response.data)) {
          // If response.data is directly the array
          setRoles(response.data);
          // Set default pagination if not provided
          setPagination({
            current_page: filters.page,
            last_page: Math.ceil(response.data.length / filters.per_page) || 1,
            total: response.data.length,
          });
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If response.data.data is the array with pagination info
          setRoles(response.data.data);
          setPagination({
            current_page: response.data.current_page || filters.page,
            last_page: response.data.last_page || 1,
            total: response.data.total || response.data.data.length,
          });
        } else {
          // Unexpected format, log for debugging
          console.error("Unexpected API response format:", response.data);
          setError("Received unexpected data format from the server");
          setRoles([]);
        }
      } else {
        console.error("Invalid API response:", response);
        setError("Failed to retrieve roles from the server");
        setRoles([]);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch roles. Please try again later."
      );
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (column) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: column,
      sort_direction:
        prev.sort_by === column && prev.sort_direction === "asc"
          ? "desc"
          : "asc",
      page: 1,
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      setLoading(true);
      const response = await roleService.delete(id);
      setSuccess("Role deleted successfully");
      fetchRoles();
    } catch (err) {
      console.error("Error deleting role:", err);
      setError(
        err.response?.data?.message ||
          "Failed to delete role. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSortIcon = (column) => {
    if (filters.sort_by !== column) {
      return (
        <span className="text-gray-400 ml-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </span>
      );
    }

    return (
      <span className="text-blue-500 ml-1">
        {filters.sort_direction === "asc" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </span>
    );
  };

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div>
      <PageHeader
        title="Role Management"
        subtitle="Create and manage roles"
        actionText="Create Role"
        actionPath="/roles/create"
      />

      <Card>
        <div className="p-6">
          {success && (
            <SuccessAlert message={success} onDismiss={() => setSuccess("")} />
          )}
          {error && (
            <ErrorAlert message={error} onDismiss={() => setError("")} />
          )}

          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search roles..."
                className="flex-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border rounded-md p-2"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
              <button
                type="submit"
                className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Created At {renderSortIcon("created_at")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <tr key={role.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {role.name}
                          </div>
                          {role.description && (
                            <div className="text-sm text-gray-500">
                              {role.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(role.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/roles/${role.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500"
                      >
                        No roles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </Card>
    </div>
  );
};

export default RoleList;
