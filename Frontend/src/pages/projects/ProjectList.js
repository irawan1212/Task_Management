import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { projectService, taskService } from "../../api/services";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth

const ProjectList = () => {
  const { hasPermission } = useAuth(); // Get hasPermission from AuthContext
  const [projects, setProjects] = useState([]);
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
    status: "",
    page: 1,
    sort_by: "created_at",
    sort_order: "desc",
  });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchTaskCount = async (projectId) => {
    try {
      const response = await taskService.getAll({
        project_id: parseInt(projectId),
      });

      let tasksData = [];
      if (response.data && Array.isArray(response.data)) {
        tasksData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        tasksData = response.data.data;
      }

      // Filter tasks for this specific project
      const projectTasks = tasksData.filter(
        (task) => task.project_id === parseInt(projectId)
      );

      return projectTasks.length;
    } catch (err) {
      console.error(`Error fetching task count for project ${projectId}:`, err);
      return 0;
    }
  };

  const fetchProjects = async () => {
    if (!hasPermission("read")) {
      setError("You do not have permission to view projects");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await projectService.getAll(filters);
      console.log("Raw API response:", response);

      if (response && response.data) {
        console.log("Projects data:", response.data.data);
        let projectsData = response.data.data || [];

        // If tasks_count is not provided by API, fetch it manually
        const projectsWithTaskCount = await Promise.all(
          projectsData.map(async (project) => {
            let taskCount = project.tasks_count;

            if (
              taskCount === null ||
              taskCount === undefined ||
              taskCount === 0
            ) {
              taskCount = await fetchTaskCount(project.id);
              console.log(
                `Project ${project.id} (${project.name}): fetched task count = ${taskCount}`
              );
            } else {
              console.log(
                `Project ${project.id} (${project.name}): API task count = ${taskCount}`
              );
            }

            return {
              ...project,
              tasks_count: taskCount,
            };
          })
        );

        setProjects(projectsWithTaskCount);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          total: response.data.total || 0,
        });
      } else {
        console.error("Invalid API response format:", response);
        setError("Invalid data received from server");
      }

      setLoading(false);
    } catch (err) {
      console.error("Error in fetchProjects:", err);
      setError("Failed to fetch projects: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!hasPermission("delete")) {
      setError("You do not have permission to delete projects");
      return;
    }

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await projectService.delete(id);
        setSuccess("Project deleted successfully");
        fetchProjects();
      } catch (err) {
        setError("Failed to delete project");
      }
    }
  };

  const handleView = (id) => {
    if (!hasPermission("read")) {
      setError("You do not have permission to view projects");
      return false;
    }
    return true;
  };

  const handleEdit = (id) => {
    if (!hasPermission("update")) {
      setError("You do not have permission to edit projects");
      return false;
    }
    return true;
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleSort = (field) => {
    let sort_order = "asc";
    if (filters.sort_by === field && filters.sort_order === "asc") {
      sort_order = "desc";
    }
    setFilters({ ...filters, sort_by: field, sort_order, page: 1 });
  };

  const getSortIcon = (field) => {
    if (filters.sort_by !== field) return null;
    return filters.sort_order === "asc" ? "↑" : "↓";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      case "onhold":
      case "on_hold":
        return "On Hold";
      case "planning":
        return "Planning";
      case "cancelled":
        return "Cancelled";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "onhold":
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "planning":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Manage your projects"
        actionText="Create Project"
        actionPath="/projects/create"
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />
      <SuccessAlert message={success} onDismiss={() => setSuccess("")} />

      <Card>
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value, page: 1 })
                }
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="planning">Planning</option>
                <option value="onhold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No projects found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name {getSortIcon("name")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    Status {getSortIcon("status")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("start_date")}
                  >
                    Start Date {getSortIcon("start_date")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("end_date")}
                  >
                    End Date {getSortIcon("end_date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={
                          hasPermission("read")
                            ? `/projects/${project.id}`
                            : "#"
                        }
                        className={`font-medium ${
                          hasPermission("read")
                            ? "text-blue-600 hover:text-blue-800"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          if (!hasPermission("read")) {
                            e.preventDefault();
                            setError(
                              "You do not have permission to view projects"
                            );
                          }
                        }}
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          project.status
                        )}`}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.tasks_count || 0} tasks
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={
                          hasPermission("read")
                            ? `/projects/${project.id}`
                            : "#"
                        }
                        className={`mr-3 ${
                          hasPermission("read")
                            ? "text-indigo-600 hover:text-indigo-900"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          if (!hasPermission("read")) {
                            e.preventDefault();
                            setError(
                              "You do not have permission to view projects"
                            );
                          }
                        }}
                      >
                        View
                      </Link>
                      <Link
                        to={
                          hasPermission("update")
                            ? `/projects/${project.id}/edit`
                            : "#"
                        }
                        className={`mr-3 ${
                          hasPermission("update")
                            ? "text-blue-600 hover:text-blue-900"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          if (!hasPermission("update")) {
                            e.preventDefault();
                            setError(
                              "You do not have permission to edit projects"
                            );
                          }
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className={`${
                          hasPermission("delete")
                            ? "text-red-600 hover:text-red-900"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!hasPermission("delete")}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </Card>
    </>
  );
};

export default ProjectList;
