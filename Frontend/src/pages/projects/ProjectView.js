import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { projectService, taskService } from "../../api/services";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!(hasPermission("read") || isAdmin())) {
      setError("You do not have permission to view projects.");
      setLoading(false);
      setTasksLoading(false);
      return;
    }

    fetchProject();
    if (hasPermission("read_task") || isAdmin()) {
      fetchTasks();
    } else {
      setError("You do not have permission to view tasks.");
      setTasksLoading(false);
    }
  }, [id, hasPermission, isAdmin]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectService.get(id);
      console.log(
        "Project API response:",
        JSON.stringify(response.data, null, 2)
      );

      if (!response.data) {
        throw new Error("No project data received from server");
      }

      setProject(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching project:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(
        err.response?.status === 404
          ? "Project not found"
          : err.response?.status === 401
          ? "Unauthorized: Please log in again."
          : err.response?.status === 403
          ? "Permission denied: You cannot access this project."
          : `Failed to fetch project details: ${err.message}`
      );
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const response = await taskService.getAll({
        project_id: parseInt(id),
      });

      console.log(
        "Tasks API response:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("Requested project_id:", id);

      let tasksData = [];
      if (response.data && Array.isArray(response.data)) {
        tasksData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        tasksData = response.data.data;
      } else {
        console.warn("No valid tasks array found in response:", response.data);
        tasksData = [];
      }

      const filteredTasks = tasksData.filter((task) => {
        const taskProjectId = task.project_id;
        const currentProjectId = parseInt(id);
        console.log(
          `Task ${task.id}: project_id=${taskProjectId}, current_project=${currentProjectId}`
        );
        return taskProjectId === currentProjectId;
      });

      console.log(`Filtered ${filteredTasks.length} tasks for project ${id}`);

      const validTasks = filteredTasks.filter(
        (task) => task && task.id && task.title
      );

      const mappedTasks = validTasks.map((task) => ({
        ...task,
        name: task.title,
        status: task.is_completed ? "completed" : "todo",
        priority: task.priority || "medium",
      }));

      setTasks(mappedTasks);

      if (validTasks.length === 0 && tasksData.length > 0) {
        console.warn("Tasks were found but none belong to this project");
      }

      setTasksLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(
        err.response?.status === 404
          ? "No tasks found for this project."
          : err.response?.status === 401
          ? "Unauthorized: Please log in again."
          : err.response?.status === 403
          ? "Permission denied: You cannot access tasks."
          : `Failed to fetch tasks: ${err.message}`
      );
      setTasksLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(hasPermission("delete") || isAdmin())) {
      setError("You do not have permission to delete projects.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await projectService.delete(id);
        setSuccess("Project deleted successfully.");
        setTimeout(() => {
          navigate("/projects");
        }, 1500);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? "Permission denied: You cannot delete this project."
            : `Failed to delete project: ${err.message}`
        );
      }
    }
  };

  const refreshTasks = () => {
    if (hasPermission("read_task") || isAdmin()) {
      fetchTasks();
    } else {
      setError("You do not have permission to view tasks.");
    }
  };

  const getStatusBadgeClass = (status) => {
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

  const getTaskStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "blocked":
        return "Blocked";
      case "pending":
        return "Pending";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "To Do";
    }
  };

  const getTaskStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return "Medium";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (!(hasPermission("read") || isAdmin())) {
    return (
      <div className="p-6">
        <ErrorAlert message="You do not have permission to view projects." />
        <div className="mt-4">
          <Link to="/projects" className="text-blue-600 hover:text-blue-800">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <ErrorAlert message="Project not found." />
        <div className="mt-4">
          <Link to="/projects" className="text-blue-600 hover:text-blue-800">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle="Project details and tasks"
        actionText={
          hasPermission("update") || isAdmin() ? "Edit Project" : null
        }
        actionPath={
          hasPermission("update") || isAdmin() ? `/projects/${id}/edit` : null
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />
      <SuccessAlert message={success} onDismiss={() => setSuccess("")} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-3">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {project.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {project.description || "No description provided"}
                </p>
              </div>
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                  project.status
                )}`}
              >
                {getStatusLabel(project.status)}
              </span>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Project ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Project Manager
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.manager ? project.manager.name : "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString()
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    End Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.end_date
                      ? new Date(project.end_date).toLocaleDateString()
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Budget</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.budget
                      ? `$${project.budget.toLocaleString()}`
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Task Count
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{tasks.length}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Created At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.created_at
                      ? new Date(project.created_at).toLocaleString()
                      : "Not set"}
                  </dd>
                </div>
              </dl>
            </div>

            {project.metadata && Object.keys(project.metadata).length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Additional Information
                </h3>
                <dl className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                  {Object.entries(project.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500">
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/_/g, " ")}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {typeof value === "object" && value !== null
                          ? JSON.stringify(value)
                          : value?.toString() || "N/A"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              {(hasPermission("update") || isAdmin()) && (
                <Link
                  to={`/projects/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Edit Project
                </Link>
              )}
              {(hasPermission("delete") || isAdmin()) && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Delete Project
                </button>
              )}
              <Link
                to="/projects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Project Tasks</h2>
          {(hasPermission("create_task") || isAdmin()) && (
            <Link
              to={`/tasks/create?project_id=${id}`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Task
            </Link>
          )}
        </div>

        {tasksLoading ? (
          <Card>
            <div className="p-6 text-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-500">Loading tasks...</span>
            </div>
          </Card>
        ) : !(hasPermission("read_task") || isAdmin()) ? (
          <Card>
            <div className="p-6 text-center text-gray-500">
              You do not have permission to view tasks.
            </div>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-gray-500">
              No tasks found for this project.
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.name || "Unnamed Task"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskStatusClass(
                            task.status
                          )}`}
                        >
                          {getTaskStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : "No due date"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.assignee && task.assignee.name
                          ? task.assignee.name
                          : "Unassigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(hasPermission("read_task") || isAdmin()) && (
                          <Link
                            to={`/tasks/${task.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default ProjectView;
