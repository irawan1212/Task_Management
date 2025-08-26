// src/pages/tasks/TaskView.js
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { taskService } from "../../api/services";
import { attachmentBaseURL } from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import CustomSelect from "../../components/common/Select";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import { useAuth } from "../../contexts/AuthContext";

const TaskView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await taskService.get(id);
        const fetchedTask = response.data;
        setTask(fetchedTask);

        const assigneeId = fetchedTask.user_id || fetchedTask.assignee_id;
        if (!user || (user.role !== "admin" && user.id !== assigneeId)) {
          setIsAuthorized(false);
          setError("You are not authorized to modify this task.");
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        setError("Failed to load task. Please try again.");
        console.error("Error fetching task:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, user]);

  const handleStatusChange = async (value) => {
    if (!isAuthorized) {
      setError("You are not authorized to update this task's status.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await taskService.update(id, { status: value });

      const response = await taskService.get(id);
      setTask(response.data);
      setSuccess("Task status updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthorized) {
      setError("You are not authorized to delete this task.");
      return;
    }

    try {
      setSubmitting(true);
      await taskService.delete(id);
      setSuccess("Task deleted successfully");

      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    } finally {
      setSubmitting(false);
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

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
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

  const formatPriority = (priority) => {
    if (!priority) return "-";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const parseAdditionalInfo = (jsonString) => {
    try {
      if (!jsonString || jsonString === "{}") return null;
      const data = JSON.parse(jsonString);
      return Object.keys(data).length > 0 ? data : null;
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert message="Task not found" />
        <div className="mt-4 flex justify-center">
          <Link
            to="/tasks"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const additionalInfo = parseAdditionalInfo(
    task?.meta_data || task?.additional_info
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Task Details"
        subtitle="View and manage task information"
        actionText="Back to Tasks"
        actionPath="/tasks"
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError("")} />}
      {success && (
        <SuccessAlert message={success} onDismiss={() => setSuccess("")} />
      )}

      {task && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            {isAuthorized && (
              <div className="flex space-x-3">
                <Link
                  to={`/tasks/${id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Task
                </Link>
                {isConfirmingDelete ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDelete}
                      disabled={submitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium">Task Information</h2>
                </div>
                <div className="p-6">
                  <div className="mb-6 flex flex-wrap gap-2">
                    {isAuthorized ? (
                      <div className="flex items-center">
                        <label
                          htmlFor="status"
                          className="mr-2 text-sm font-medium text-gray-700"
                        >
                          Status:
                        </label>
                        <CustomSelect
                          id="status"
                          name="status"
                          value={task.status || "pending"}
                          options={statusOptions}
                          onChange={handleStatusChange}
                          disabled={submitting}
                          className="w-40"
                        />
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeClass(
                          task.status
                        )}`}
                      >
                        {formatStatus(task.status)}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getPriorityBadgeClass(
                        task.priority
                      )}`}
                    >
                      {formatPriority(task.priority)}
                    </span>
                    {task.is_flagged && (
                      <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-red-100 text-red-800">
                        Flagged
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Description
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {task.description ? (
                        <p className="whitespace-pre-line">
                          {task.description}
                        </p>
                      ) : (
                        <p className="text-gray-400 italic">
                          No description provided
                        </p>
                      )}
                    </div>
                  </div>

                  {additionalInfo && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Additional Information
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(additionalInfo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(task.attachment || task.attachment_url) && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Attachment
                      </h3>
                      <div className="flex items-center">
                        <svg
                          className="h-6 w-6 text-gray-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <a
                          href={
                            task.attachment_url ||
                            `${attachmentBaseURL}/storage/${task.attachment}` // Changed to /storage/ to match the storage link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate"
                          download
                        >
                          {task.attachment_name || "Download Attachment"}
                        </a>{" "}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div>
              <Card>
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium">Details</h2>
                </div>
                <div className="p-6">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Project
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {task.project?.name || "-"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Category
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {task.category?.name || "-"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Assignee
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {task.assignee?.name || task.user?.name || "-"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Due Date
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(task.due_date)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Created
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(task.created_at)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(task.updated_at)}
                      </dd>
                    </div>

                    {task.created_by && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Created By
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {task.created_by}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskView;
