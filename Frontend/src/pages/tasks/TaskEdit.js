// src/pages/tasks/TaskEdit.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  taskService,
  projectService,
  categoryService,
  userService,
} from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import CustomSelect from "../../components/common/Select";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

const TaskEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    category_id: "",
    user_id: "",
    status: "pending",
    due_date: "",
    meta_data: "{}",
  });
  const [originalTask, setOriginalTask] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isAuthorized, setIsAuthorized] = useState(false);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          taskResponse,
          projectsResponse,
          categoriesResponse,
          usersResponse,
        ] = await Promise.all([
          taskService.get(id),
          projectService.getAll(),
          categoryService.getAll(),
          userService.getAll(),
        ]);

        const task = taskResponse.data;
        console.log("Fetched task data:", task);
        setOriginalTask(task);

        console.log("Authenticated user:", user);
        const assigneeId = task.assignee_id || task.user_id;
        console.log("Task assignee ID:", assigneeId);

        // Check both permission and assignee-based authorization
        if (
          !user ||
          (!(hasPermission("update") || isAdmin()) && user.id !== assigneeId)
        ) {
          setError("You are not authorized to edit this task.");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }
        setIsAuthorized(true);

        const formattedDate = task.due_date
          ? new Date(task.due_date).toISOString().split("T")[0]
          : "";

        const projectOptions = projectsResponse.data.data.map((p) => ({
          value: p.id,
          label: p.name,
        }));
        setProjects(projectOptions);

        let initialProjectId = task.project_id || "";
        if (
          projectOptions.length > 0 &&
          !projectOptions.some((p) => p.value === initialProjectId)
        ) {
          initialProjectId = projectOptions[0].value;
          setError(
            "The task's original project is invalid. Defaulting to the first available project."
          );
        }

        setFormData({
          title: task.title || "",
          description: task.description || "",
          project_id: initialProjectId,
          category_id: task.category_id || "",
          user_id: task.assignee_id || task.user_id || "",
          status: task.status || (task.is_completed ? "completed" : "pending"),
          due_date: formattedDate,
          meta_data: JSON.stringify(task.meta_data || {}, null, 2),
        });

        setCategories(
          categoriesResponse.data.data.map((c) => ({
            value: c.id,
            label: c.name,
          }))
        );
        setUsers(
          usersResponse.data.data.map((u) => ({ value: u.id, label: u.name }))
        );

        console.log("Available projects:", projectOptions);
        console.log("Form data initialized:", {
          title: task.title,
          project_id: initialProjectId,
          category_id: task.category_id,
          user_id: task.assignee_id || task.user_id,
          status: task.status || (task.is_completed ? "completed" : "pending"),
        });

        if (projectOptions.length === 0) {
          setError("No projects available. Please create a project first.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load task data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, hasPermission, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name, value) => {
    console.log(`Updating ${name} to:`, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        e.target.value = "";
        return;
      }
      if (file.size < 1 * 1024 || file.size > 500 * 1024) {
        setError("File size must be between 1KB and 500KB");
        e.target.value = "";
        return;
      }
      setAttachment(file);
      setError("");
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.project_id) errors.project_id = "Project is required";
    else if (!projects.some((p) => p.value === formData.project_id))
      errors.project_id = "Selected project is invalid";
    if (!formData.category_id) errors.category_id = "Category is required";
    if (!formData.user_id) errors.user_id = "Assignee is required";

    try {
      JSON.parse(formData.meta_data);
    } catch (e) {
      errors.meta_data = "Meta data must be valid JSON";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fix the validation errors");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      console.log("Submitting form with data:", formData);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        project_id: Number(formData.project_id),
        category_id: Number(formData.category_id),
        assignee_id: Number(formData.user_id),
        status: formData.status,
        due_date: formData.due_date || null,
        meta_data: formData.meta_data,
      };

      console.log("Update data prepared:", updateData);

      const response = await taskService.update(id, updateData);
      console.log("Task updated successfully:", response.data);

      if (attachment) {
        console.log("Uploading attachment:", attachment.name);
        try {
          await taskService.uploadAttachment(id, attachment);
          console.log("Attachment uploaded successfully");
        } catch (attachmentError) {
          console.error("Failed to upload attachment:", attachmentError);
          setError("Task updated but failed to upload attachment");
        }
      }

      setSuccess("Task updated successfully!");

      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
    } catch (err) {
      console.error("Error updating task:", err);

      if (err.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key] = err.response.data.errors[key][0];
        });
        setFieldErrors(serverErrors);
        setError("Please fix the validation errors");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to update task. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Access Denied"
          subtitle="You are not authorized to edit this task"
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You can only edit tasks that are assigned to you or if you have
              update permissions/admin role.
            </p>
            <Link
              to="/tasks"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Tasks
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Edit Task"
        subtitle={`Update task: ${originalTask?.title || "Loading..."}`}
      />

      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter task title"
              disabled={submitting}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task description"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="project_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project *
              </label>
              <CustomSelect
                options={projects}
                value={formData.project_id}
                onChange={(value) => handleSelectChange("project_id", value)}
                placeholder="Select a project"
                disabled={submitting}
                error={fieldErrors.project_id}
              />
              {fieldErrors.project_id && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.project_id}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <CustomSelect
                options={categories}
                value={formData.category_id}
                onChange={(value) => handleSelectChange("category_id", value)}
                placeholder="Select a category"
                disabled={submitting}
                error={fieldErrors.category_id}
              />
              {fieldErrors.category_id && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.category_id}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="user_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assignee *
              </label>
              <CustomSelect
                options={users}
                value={formData.user_id}
                onChange={(value) => handleSelectChange("user_id", value)}
                placeholder="Select an assignee"
                disabled={submitting}
                error={fieldErrors.user_id}
              />
              {fieldErrors.user_id && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.user_id}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <CustomSelect
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleSelectChange("status", value)}
                placeholder="Select status"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="due_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="attachment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Attachment (PDF, 1KB-500KB)
            </label>
            <input
              type="file"
              id="attachment"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
            {originalTask?.attachment && (
              <p className="mt-1 text-sm text-gray-500">
                Current attachment: {originalTask.attachment.split("/").pop()}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="meta_data"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Meta Data (JSON)
            </label>
            <textarea
              id="meta_data"
              name="meta_data"
              value={formData.meta_data}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                fieldErrors.meta_data ? "border-red-500" : "border-gray-300"
              }`}
              placeholder='{"key": "value"}'
              disabled={submitting}
            />
            {fieldErrors.meta_data && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.meta_data}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              to="/tasks"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting && <LoadingSpinner size="small" className="mr-2" />}
              {submitting ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TaskEdit;
