import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Added Link import
import { projectService, categoryService } from "../../api/services";
import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CustomSelect from "../../components/common/Select";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "onhold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: null,
    status: statusOptions[0],
    budget: "",
    start_date: "",
    due_date: "",
    additional_info: "{}",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitError, setSubmitError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    if (!(hasPermission("update") || isAdmin())) {
      setSubmitError("You do not have permission to edit projects.");
      setFetching(false);
      return;
    }

    const loadData = async () => {
      try {
        setFetching(true);
        setLoadingCategories(true);

        const [projectRes, categoryRes] = await Promise.allSettled([
          projectService.get(id),
          categoryService.getAll(),
        ]);

        console.log("Project Response:", projectRes);
        console.log("Category Response:", categoryRes);

        let projectData = null;
        if (projectRes.status === "fulfilled") {
          projectData =
            projectRes.value.data?.data || projectRes.value.data || null;
          if (projectData && typeof projectData === "object") {
            const selectedStatus =
              statusOptions.find((s) => s.value === projectData.status) ||
              statusOptions[0];

            setFormData({
              name: projectData.name || "",
              description: projectData.description || "",
              category_id: null,
              status: selectedStatus,
              budget: projectData.budget || "",
              start_date: projectData.start_date || "",
              due_date: projectData.due_date || "",
              additional_info: projectData.settings
                ? JSON.stringify(projectData.settings, null, 2)
                : "{}",
            });
          } else {
            console.error("Invalid project data structure:", projectData);
            setSubmitError("Invalid project data received from server");
          }
        } else {
          console.error("Failed to fetch project:", projectRes.reason);
          setSubmitError(
            projectRes.reason?.response?.data?.message ||
              "Failed to load project details"
          );
        }

        if (categoryRes.status === "fulfilled") {
          const categoryData =
            categoryRes.value.data?.data || categoryRes.value.data || [];
          const categoryList = Array.isArray(categoryData)
            ? categoryData.map((c) => ({
                value: c.id,
                label: c.name,
              }))
            : [];

          if (categoryList.length === 0) {
            setCategoriesError(
              "No categories available. Please create a category first."
            );
          } else {
            if (projectData?.category_id) {
              const selectedCategory = categoryList.find(
                (c) => c.value === projectData.category_id
              );
              setFormData((prev) => ({
                ...prev,
                category_id: selectedCategory || null,
              }));
            }
            setCategories(categoryList);
          }
        } else {
          console.error("Failed to fetch categories:", categoryRes.reason);
          setCategoriesError(
            categoryRes.reason?.response?.data?.message ||
              "Failed to load categories."
          );
        }
      } catch (err) {
        console.error("Unexpected error in loadData:", err);
        setSubmitError("An unexpected error occurred");
        setCategoriesError("Failed to load data");
      } finally {
        setFetching(false);
        setLoadingCategories(false);
      }
    };

    loadData();
  }, [id, hasPermission, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (field, selectedOption) => {
    setFormData((prev) => ({ ...prev, [field]: selectedOption }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleJsonChange = (e) => {
    const val = e.target.value;
    try {
      JSON.parse(val);
      setFormData((prev) => ({ ...prev, additional_info: val }));
      if (errors.additional_info)
        setErrors((prev) => ({ ...prev, additional_info: "" }));
    } catch {
      setFormData((prev) => ({ ...prev, additional_info: val }));
      setErrors((prev) => ({
        ...prev,
        additional_info: "Invalid JSON format",
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Project name is required";
    if (!formData.category_id) errs.category_id = "Category is required";

    try {
      JSON.parse(formData.additional_info);
    } catch {
      errs.additional_info = "Invalid JSON format";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(hasPermission("update") || isAdmin())) {
      setSubmitError("You do not have permission to edit projects.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const payload = {
        ...formData,
        category_id: formData.category_id?.value,
        status: formData.status?.value,
        additional_info: JSON.parse(formData.additional_info),
      };
      await projectService.update(id, payload);
      navigate("/projects");
    } catch (err) {
      console.error("Update failed:", err);
      if (err.response?.status === 401) {
        setSubmitError("Unauthorized: Please log in again.");
        navigate("/login");
      } else if (err.response?.status === 403) {
        setSubmitError("Permission denied: You cannot update projects.");
      } else if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setSubmitError("Validation error: Please check your input.");
      } else {
        setSubmitError(
          err.response?.data?.message || "Failed to update project"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    navigate("/categories/create");
  };

  if (!(hasPermission("update") || isAdmin())) {
    return (
      <div className="p-6">
        <ErrorAlert message="You do not have permission to edit projects." />
        <div className="mt-4">
          <Link to="/projects" className="text-blue-600 hover:text-blue-800">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Edit Project"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Projects", path: "/projects" },
          { label: "Edit Project" },
        ]}
      />

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && <ErrorAlert message={submitError} />}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            {categoriesError ? (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md flex justify-between items-center">
                <p className="text-yellow-800 text-sm">{categoriesError}</p>
                {(hasPermission("create") || isAdmin()) && (
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600"
                  >
                    Create Category
                  </button>
                )}
              </div>
            ) : (
              <>
                <CustomSelect
                  value={formData.category_id}
                  onChange={(val) => handleSelectChange("category_id", val)}
                  options={categories}
                  isLoading={loadingCategories}
                  placeholder="Select a category"
                  className={errors.category_id ? "border-red-500" : ""}
                />
                {errors.category_id && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.category_id}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <CustomSelect
              value={formData.status}
              onChange={(val) => handleSelectChange("status", val)}
              options={statusOptions}
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Budget
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Info (JSON)
            </label>
            <textarea
              name="additional_info"
              rows={6}
              value={formData.additional_info}
              onChange={handleJsonChange}
              className={`mt-1 block w-full rounded-md font-mono text-sm shadow-sm ${
                errors.additional_info ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.additional_info && (
              <p className="text-red-600 text-sm mt-1">
                {errors.additional_info}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="px-4 py-2 border rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !!categoriesError ||
                !(hasPermission("update") || isAdmin())
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProjectEdit;
