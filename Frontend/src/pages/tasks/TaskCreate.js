// src/pages/tasks/TaskCreate.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

const TaskCreate = () => {
  const { hasPermission, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get("project_id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: projectIdFromUrl || "",
    category_id: "",
    user_id: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    tags: "",
    additional_info: "{}",
    is_flagged: false,
  });
  const [attachment, setAttachment] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [projectsResponse, categoriesResponse, usersResponse] =
          await Promise.all([
            projectService.getAll(),
            categoryService.getAll(),
            userService.getAll(),
          ]);

        setProjects(
          projectsResponse.data.data.map((project) => ({
            value: project.id,
            label: project.name,
          }))
        );

        setCategories(
          categoriesResponse.data.data.map((category) => ({
            value: category.id,
            label: category.name,
          }))
        );

        setUsers(
          usersResponse.data.data.map((user) => ({
            value: user.id,
            label: user.name,
          }))
        );
      } catch (err) {
        setError("Failed to load options. Please try again.");
        console.error("Error fetching options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      if (
        name === "user_id" &&
        value &&
        (!prev.status || prev.status === "pending")
      ) {
        updatedData.status = "in_progress";
      }
      return updatedData;
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        e.target.value = "";
        return;
      }

      if (file.size < 100 * 1024 || file.size > 500 * 1024) {
        setError("File size must be between 100KB and 500KB");
        e.target.value = "";
        return;
      }

      setAttachment(file);
      setError("");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.project_id) {
      errors.project_id = "Project is required";
    }

    if (!formData.category_id) {
      errors.category_id = "Category is required";
    }

    if (!formData.user_id) {
      errors.user_id = "Assignee is required";
    }

    try {
      if (formData.additional_info) {
        JSON.parse(formData.additional_info);
      }
    } catch (e) {
      errors.additional_info = "Additional info must be valid JSON";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formattedData = {
        ...formData,
        project_id: parseInt(formData.project_id),
        category_id: parseInt(formData.category_id),
        user_id: parseInt(formData.user_id),
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        additional_info: formData.additional_info || "{}",
      };

      console.log("Creating task with data:", formattedData);

      const response = await taskService.create(formattedData);
      const taskId = response.data.id;

      if (attachment && taskId) {
        try {
          await taskService.uploadAttachment(taskId, attachment);
          console.log("Attachment uploaded successfully for task:", taskId);
        } catch (uploadError) {
          const errorMessage =
            uploadError.response?.data?.message ||
            uploadError.response?.data?.errors?.attachment?.[0] ||
            "Failed to upload attachment. Please try again.";
          setError(
            `Task created successfully, but failed to upload attachment: ${errorMessage}`
          );
          return;
        }
      }

      if (projectIdFromUrl) {
        navigate(`/projects/${projectIdFromUrl}`);
      } else {
        navigate("/tasks");
      }
    } catch (err) {
      console.error("Error creating task:", err);
      const responseErrors = err.response?.data?.errors;
      if (responseErrors) {
        const formattedErrors = {};
        Object.keys(responseErrors).forEach((key) => {
          formattedErrors[key] = responseErrors[key][0];
        });
        setFieldErrors(formattedErrors);
        setError("Please fix the errors in the form");
      } else {
        setError(err.response?.data?.message || "Failed to create task");
      }
    } finally {
      setLoading(false);
      setAttachment(null);
      document.getElementById("attachment").value = "";
    }
  };

  if (!hasPermission("create") && !isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Access Denied"
          subtitle="You are not authorized to create tasks"
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You do not have permission to create tasks.
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

  if (loadingOptions) {
    return <LoadingSpinner />;
  }

  const backPath = projectIdFromUrl
    ? `/projects/${projectIdFromUrl}`
    : "/tasks";
  const backText = projectIdFromUrl ? "Back to Project" : "Back to Tasks";

  return (
    <div>
      <PageHeader
        title="Create Task"
        subtitle="Create a new task in the system"
        actionText={backText}
        actionPath={backPath}
      />

      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Task Information</h2>
          {projectIdFromUrl && (
            <p className="text-sm text-gray-600 mt-1">
              Creating task for selected project
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <ErrorAlert message={error} onDismiss={() => setError("")} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  fieldErrors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <CustomSelect
                label="Project"
                name="project_id"
                options={projects}
                value={formData.project_id}
                onChange={(value) => handleSelectChange("project_id", value)}
                error={fieldErrors.project_id}
                required
                disabled={!!projectIdFromUrl}
              />
              {projectIdFromUrl && (
                <p className="mt-1 text-xs text-gray-500">
                  Project is pre-selected from the project page
                </p>
              )}
            </div>

            <div>
              <CustomSelect
                label="Category"
                name="category_id"
                options={categories}
                value={formData.category_id}
                onChange={(value) => handleSelectChange("category_id", value)}
                error={fieldErrors.category_id}
                required
              />
            </div>

            <div>
              <CustomSelect
                label="Assignee"
                name="user_id"
                options={users}
                value={formData.user_id}
                onChange={(value) => handleSelectChange("user_id", value)}
                error={fieldErrors.user_id}
                required
              />
            </div>

            <div>
              <CustomSelect
                label="Status"
                name="status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleSelectChange("status", value)}
                error={fieldErrors.status}
              />
            </div>

            <div>
              <CustomSelect
                label="Priority"
                name="priority"
                options={priorityOptions}
                value={formData.priority}
                onChange={(value) => handleSelectChange("priority", value)}
                error={fieldErrors.priority}
              />
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags (comma separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="tag1, tag2, tag3"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_flagged"
                  name="is_flagged"
                  checked={formData.is_flagged}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_flagged"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Flag as important
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <div className="col-span-2">
              <label
                htmlFor="additional_info"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Additional Info (JSON)
              </label>
              <textarea
                id="additional_info"
                name="additional_info"
                rows="3"
                value={formData.additional_info}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md font-mono text-sm ${
                  fieldErrors.additional_info
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="{}"
              ></textarea>
              {fieldErrors.additional_info && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.additional_info}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label
                htmlFor="attachment"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Attachment (PDF only, 100KB - 500KB)
              </label>
              <input
                type="file"
                id="attachment"
                accept="application/pdf"
                onChange={handleAttachmentChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only PDF files between 100KB and 500KB are accepted
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TaskCreate;
