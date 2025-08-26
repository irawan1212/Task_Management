import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  taskService,
  projectService,
  categoryService,
  importExportService,
} from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import CustomSelect from "../../components/common/Select";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth

const TaskList = () => {
  const { hasPermission } = useAuth(); // Get hasPermission from AuthContext
  const [tasks, setTasks] = useState([]);
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
    sort_by: "created_at",
    sort_order: "desc",
    page: 1,
  });
  const [fileImport, setFileImport] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Status options for filtering
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Sort options
  const sortOptions = [
    { value: "created_at-desc", label: "Newest First" },
    { value: "created_at-asc", label: "Oldest First" },
    { value: "title-asc", label: "Title (A-Z)" },
    { value: "title-desc", label: "Title (Z-A)" },
    { value: "status-asc", label: "Status (A-Z)" },
    { value: "status-desc", label: "Status (Z-A)" },
  ];

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchProjectsAndCategories = async (tasks) => {
    try {
      const projectIds = [
        ...new Set(tasks.map((task) => task.project_id).filter((id) => id)),
      ];
      const categoryIds = [
        ...new Set(tasks.map((task) => task.category_id).filter((id) => id)),
      ];

      const [projectsResponse, categoriesResponse] = await Promise.all([
        projectIds.length > 0
          ? projectService.getAll({ id: projectIds })
          : Promise.resolve({ data: { data: [] } }),
        categoryIds.length > 0
          ? categoryService.getAll({ id: categoryIds })
          : Promise.resolve({ data: { data: [] } }),
      ]);

      const projectsMap = projectsResponse.data.data.reduce((map, project) => {
        map[project.id] = project;
        return map;
      }, {});
      const categoriesMap = categoriesResponse.data.data.reduce(
        (map, category) => {
          map[category.id] = category;
          return map;
        },
        {}
      );

      return tasks.map((task) => ({
        ...task,
        project: projectsMap[task.project_id] || null,
        category: categoriesMap[task.category_id] || null,
      }));
    } catch (err) {
      throw new Error(
        "Failed to fetch projects or categories: " +
          (err.message || "Unknown error")
      );
    }
  };

  const fetchTasks = async () => {
    if (!hasPermission("read")) {
      setError("You do not have permission to view tasks");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await taskService.getAll(filters);
      const tasksWithDetails = await fetchProjectsAndCategories(
        response.data.data
      );
      setTasks(tasksWithDetails);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch tasks or related data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  };

  const handleSortChange = (value) => {
    if (value) {
      const [sort_by, sort_order] = value.split("-");
      setFilters((prev) => ({ ...prev, sort_by, sort_order, page: 1 }));
    }
  };

  const handleDelete = async (id) => {
    if (!hasPermission("delete")) {
      setError("You do not have permission to delete tasks");
      return;
    }

    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await taskService.delete(id);
        setSuccess("Task deleted successfully");
        fetchTasks();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete task");
      }
    }
  };

  const handleFileChange = (e) => {
    setFileImport(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!hasPermission("create")) {
      setError("You do not have permission to import tasks");
      return;
    }

    if (!fileImport) {
      setError("Please select a file to import");
      return;
    }

    try {
      setImportLoading(true);
      await importExportService.importTasks(fileImport);
      setSuccess("Tasks import has been queued and will be processed soon");
      setFileImport(null);
      e.target.reset();
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import tasks");
    } finally {
      setImportLoading(false);
    }
  };

  const handleExport = async () => {
    if (!hasPermission("read")) {
      setError("You do not have permission to export tasks");
      return;
    }

    try {
      setExportLoading(true);
      const response = await importExportService.exportTasks(filters);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `tasks_export_${new Date().getTime()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess("Tasks exported successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export tasks");
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <div>
      <PageHeader
        title="Task Management"
        subtitle="Create, view, and manage tasks"
        actionText={hasPermission("create") ? "Create Task" : null}
        actionPath={hasPermission("create") ? "/tasks/create" : null}
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />
      <SuccessAlert message={success} onDismiss={() => setSuccess("")} />

      <Card className="mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Tasks</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={handleSearchChange}
                disabled={!hasPermission("read")}
              />
            </div>

            <div className="w-full md:w-1/4">
              <CustomSelect
                options={statusOptions}
                value={filters.status}
                onChange={handleStatusChange}
                placeholder="Filter by status"
                disabled={!hasPermission("read")}
              />
            </div>

            <div className="w-full md:w-1/4">
              <CustomSelect
                options={sortOptions}
                value={`${filters.sort_by}-${filters.sort_order}`}
                onChange={handleSortChange}
                placeholder="Sort by"
                disabled={!hasPermission("read")}
              />
            </div>
          </div>

          {/* Import/Export Section - Only show if user has appropriate permissions */}
          {(hasPermission("create") || hasPermission("read")) && (
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              {hasPermission("create") && (
                <div className="flex-1">
                 
                </div>
              )}
              {hasPermission("read") && (
                <div>
                  </div>
              )}
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={hasPermission("read") ? `/tasks/${task.id}` : "#"}
                          className={`${
                            hasPermission("read")
                              ? "text-blue-600 hover:text-blue-900"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={(e) => {
                            if (!hasPermission("read")) {
                              e.preventDefault();
                              setError(
                                "You do not have permission to view tasks"
                              );
                            }
                          }}
                        >
                          {task.title || "-"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.project?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.category?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                            task.status
                          )}`}
                        >
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(task.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={
                              hasPermission("read") ? `/tasks/${task.id}` : "#"
                            }
                            className={`${
                              hasPermission("read")
                                ? "text-blue-600 hover:text-blue-900"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            onClick={(e) => {
                              if (!hasPermission("read")) {
                                e.preventDefault();
                                setError(
                                  "You do not have permission to view tasks"
                                );
                              }
                            }}
                          >
                            View
                          </Link>
                          <Link
                            to={
                              hasPermission("update")
                                ? `/tasks/${task.id}/edit`
                                : "#"
                            }
                            className={`${
                              hasPermission("update")
                                ? "text-indigo-600 hover:text-indigo-900"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            onClick={(e) => {
                              if (!hasPermission("update")) {
                                e.preventDefault();
                                setError(
                                  "You do not have permission to edit tasks"
                                );
                              }
                            }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className={`${
                              hasPermission("delete")
                                ? "text-red-600 hover:text-red-900"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            disabled={!hasPermission("delete")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default TaskList;
