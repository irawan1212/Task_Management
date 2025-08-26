import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { projectService, userService } from "../../api/services";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import CustomSelect from "../../components/common/Select";

const ProjectCreate = () => {
  const { hasPermission, isAdmin } = useAuth(); // Add useAuth
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    budget: "",
    manager_id: "",
    metadata: {
      client_name: "",
      priority: "medium",
      notes: "",
    },
  });

  useEffect(() => {
    // Check for create permission
    if (!(hasPermission("create") || isAdmin())) {
      setError("You do not have permission to create projects.");
      setLoadingUsers(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userService.getAll();
        console.log(
          "User API response:",
          JSON.stringify(response.data, null, 2)
        );

        let userData = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          userData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          userData = response.data;
        } else if (
          response?.data?.users &&
          Array.isArray(response.data.users)
        ) {
          userData = response.data.users;
        } else {
          console.error("Invalid user data format:", response.data);
          setError("Invalid user data format received from server.");
          return;
        }

        const validUsers = userData.filter(
          (user) =>
            user &&
            user.id &&
            (user.first_name || user.last_name || user.email || user.name)
        );
        console.log("Filtered users:", validUsers);

        setUsers(validUsers);
        if (validUsers.length === 0) {
          setError("No valid users found. Please create a user first.");
        }
      } catch (err) {
        console.error("Failed to fetch users:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Permission denied: You cannot access user data.");
        } else if (err.response?.status === 500) {
          setError("Server error: Unable to fetch users.");
        } else {
          setError("Failed to load users. Please try again.");
        }
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [navigate, hasPermission, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Project name is required";
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required";
    }

    if (
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      errors.end_date = "End date must be after start date";
    }

    if (formData.budget) {
      const budgetNum = parseFloat(formData.budget);
      if (isNaN(budgetNum)) {
        errors.budget = "Budget must be a valid number";
      } else if (budgetNum < 0) {
        errors.budget = "Budget cannot be negative";
      }
    }

    if (!formData.manager_id) {
      errors.manager_id = "Project manager is required";
    }

    if (formData.metadata) {
      if (
        formData.metadata.priority &&
        !["low", "medium", "high", "urgent"].includes(
          formData.metadata.priority
        )
      ) {
        errors["metadata.priority"] = "Invalid priority value";
      }
    }

    return errors;
  };

  const prepareDataForSubmission = () => {
    return {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      manager_id: formData.manager_id ? Number(formData.manager_id) : null,
      metadata: {
        client_name: formData.metadata.client_name.trim() || "",
        priority: formData.metadata.priority || "medium",
        notes: formData.metadata.notes.trim() || "",
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check create permission before submission
    if (!(hasPermission("create") || isAdmin())) {
      setError("You do not have permission to create projects.");
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const projectData = prepareDataForSubmission();

    try {
      setLoading(true);
      const response = await projectService.create(projectData);
      console.log("Project created successfully:", response.data);
      navigate(`/projects/${response.data.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized: Please log in again.");
        navigate("/login");
      } else if (err.response?.status === 403) {
        setError("Permission denied: You cannot create projects.");
      } else if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {});
        setError("Validation error: Please check your input.");
      } else if (err.response?.status === 500) {
        setError("Server error occurred. Please try again.");
      } else {
        setError("Failed to create project. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatUserName = (user) => {
    if (!user) return "";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const email = user.email || "";
    const name = user.name || "";
    if (name) return name;
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    if (email) return email;
    return `User #${user.id}`;
  };

  // If no create permission, show only error message
  if (!(hasPermission("create") || isAdmin())) {
    return (
      <div className="p-6">
        <ErrorAlert message="You do not have permission to create projects." />
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
        title="Create Project"
        subtitle="Add a new project to your workspace"
        actionText="Back to Projects"
        actionPath="/projects"
      />

      <Card>
        <div className="p-6">
          {error && (
            <ErrorAlert message={error} onDismiss={() => setError("")} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Project Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="onhold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.start_date
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                {formErrors.start_date && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.start_date}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor="end_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.end_date
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                {formErrors.end_date && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.end_date}
                  </p>
                )}
              </div>

              {/* Budget */}
              <div>
                <label
                  htmlFor="budget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Budget
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className={`pl-7 block w-full rounded-md shadow-sm ${
                      formErrors.budget
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {formErrors.budget && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.budget}
                  </p>
                )}
              </div>

              {/* Project Manager */}
              <div>
                <label
                  htmlFor="manager_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Project Manager <span className="text-red-500">*</span>
                </label>
                {loadingUsers ? (
                  <div className="mt-1 flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span className="text-sm text-gray-500">
                      Loading users...
                    </span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md flex justify-between items-center">
                    <p className="text-yellow-800 text-sm">
                      No users available. Please create a user first.
                    </p>
                    <Link
                      to="/users/create"
                      className="ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600"
                    >
                      Create User
                    </Link>
                  </div>
                ) : (
                  <CustomSelect
                    id="manager_id"
                    value={formData.manager_id}
                    onChange={(value) =>
                      handleSelectChange("manager_id", value)
                    }
                    options={users.map((user) => ({
                      value: user.id,
                      label: formatUserName(user),
                    }))}
                    placeholder="Select a manager..."
                    isLoading={loadingUsers}
                    className={`mt-1 block w-full ${
                      formErrors.manager_id ? "border-red-500" : ""
                    }`}
                  />
                )}
                {formErrors.manager_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.manager_id}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Project description..."
              />
            </div>

            {/* Metadata Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">
                Additional Information
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Name */}
                <div>
                  <label
                    htmlFor="metadata.client_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="metadata.client_name"
                    name="metadata.client_name"
                    value={formData.metadata.client_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="metadata.priority"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Priority
                  </label>
                  <select
                    id="metadata.priority"
                    name="metadata.priority"
                    value={formData.metadata.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {formErrors["metadata.priority"] && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors["metadata.priority"]}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="metadata.notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes
                  </label>
                  <textarea
                    id="metadata.notes"
                    name="metadata.notes"
                    rows={3}
                    value={formData.metadata.notes}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <Link
                to="/projects"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={
                  loading ||
                  loadingUsers ||
                  users.length === 0 ||
                  !(hasPermission("create") || isAdmin())
                }
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </>
  );
};

export default ProjectCreate;
