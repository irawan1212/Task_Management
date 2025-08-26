import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { userService, roleService, taskService } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import Pagination from "../../components/common/Pagination";

const UserList = () => {
  const [users, setUsers] = useState([]);
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
    role_filter: "",
    page: 1,
    sort_by: "name",
    sort_order: "asc",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch users and roles in parallel
      const [userResponse, roleResponse] = await Promise.all([
        userService.getAll(filters),
        roleService.getAll(),
      ]);

      // Log responses for debugging
      console.log(
        "User API response:",
        JSON.stringify(userResponse.data, null, 2)
      );
      console.log(
        "Role API response:",
        JSON.stringify(roleResponse.data, null, 2)
      );

      // Handle user data
      const userData = userResponse.data.data || userResponse.data;
      const paginationData = {
        current_page:
          userResponse.data.current_page ||
          userResponse.data.meta?.current_page ||
          1,
        last_page:
          userResponse.data.last_page || userResponse.data.meta?.last_page || 1,
        total:
          userResponse.data.total ||
          userResponse.data.meta?.total ||
          userData.length,
      };

      // Transform user data to include role name
      const transformedUsers = Array.isArray(userData)
        ? userData.map((user) => {
            const roleName = user.role || "N/A";
            console.log(`User ${user.name}: roleName=${roleName}`);
            return {
              ...user,
              role: roleName,
            };
          })
        : [];

      console.log("Transformed Users:", transformedUsers);

      if (transformedUsers.every((user) => user.role === "N/A")) {
        setError(
          "Role information is not available for users. Please ensure roles are assigned and included in the API response."
        );
      }

      setUsers(transformedUsers);
      setPagination(paginationData);

      // Update role_filter options based on roles from API
      const roleOptions = roleResponse.data.data
        .filter((role) => role.name || role.role_name)
        .map((role) => ({
          value: role.name || role.role_name,
          label: role.name || role.role_name,
        }));
      setRoles(roleOptions);
    } catch (err) {
      console.error("Error fetching users or roles:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to fetch users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleSort = (field) => {
    let order = "asc";
    if (filters.sort_by === field && filters.sort_order === "asc") {
      order = "desc";
    }
    setFilters({
      ...filters,
      sort_by: field,
      sort_order: order,
      page: 1,
    });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This will also delete their associated tasks."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Fetch tasks where user is either user_id or assignee_id
      console.log(`Fetching tasks for user ${id} (user_id or assignee_id)`);
      const tasksResponse = await taskService.getAll({
        user_id: id,
        assignee_id: id,
      });
      console.log(
        "Tasks response:",
        JSON.stringify(tasksResponse.data, null, 2)
      );

      // Handle different possible response formats
      const tasks = tasksResponse.data.data || tasksResponse.data || [];
      console.log(`Found ${tasks.length} tasks for user ${id}`);

      if (tasks.length > 0) {
        console.log(`Deleting ${tasks.length} tasks for user ${id}`);
        await Promise.all(
          tasks.map(async (task) => {
            try {
              await taskService.delete(task.id);
              console.log(`Deleted task ${task.id}`);
            } catch (taskErr) {
              console.error(
                `Failed to delete task ${task.id}:`,
                taskErr.response || taskErr
              );
              throw new Error(
                `Failed to delete task ${task.id}: ${taskErr.message}`
              );
            }
          })
        );
        console.log(
          `Successfully deleted ${tasks.length} tasks for user ${id}`
        );
      } else {
        console.log(`No tasks found for user ${id}`);
      }

      // Delete the user
      console.log(`Deleting user ${id}`);
      await userService.delete(id);
      setSuccess("User and associated tasks deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user or tasks:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred";
      setError(`Failed to delete user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getSortIcon = (field) => {
    if (filters.sort_by !== field) {
      return null;
    }
    return filters.sort_order === "asc" ? " ↑" : " ↓";
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts and their roles"
        actionText="Add User"
        actionPath="/users/create"
      />

      <Card>
        <div className="p-4">
          <SuccessAlert message={success} onDismiss={() => setSuccess("")} />
          <ErrorAlert message={error} onDismiss={() => setError("")} />

          {/* Search and Filter */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  className="w-full px-4 py-2 border rounded-md"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
              <div>
                <select
                  className="w-full px-4 py-2 border rounded-md"
                  value={filters.role_filter}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      role_filter: e.target.value,
                      page: 1,
                    })
                  }
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        Name {getSortIcon("name")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("email")}
                      >
                        Email {getSortIcon("email")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("created_at")}
                      >
                        Registered {getSortIcon("created_at")}
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
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "Administrator"
                                  ? "bg-blue-100 text-blue-800"
                                  : user.role === "User"
                                  ? "bg-green-100 text-green-800"
                                  : user.role === "Editor"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {user.created_at
                                ? new Date(user.created_at).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/users/${user.id}/edit`}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(user.id)}
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
                          colSpan="5"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserList;
