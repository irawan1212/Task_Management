import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { categoryService } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth

const CategoryCreate = () => {
  const { hasPermission } = useAuth(); // Get permission check function
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    color: "#3b82f6",
    metadata: JSON.stringify({ icon: "folder" }, null, 2),
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Check if user has 'create' permission
  if (!hasPermission("create")) {
    return (
      <div>
        <PageHeader
          title="Unauthorized"
          subtitle="You do not have permission to create categories."
          actionText="Back to Categories"
          actionPath="/categories"
        />
        <Card>
          <div className="p-6 text-center text-red-600">
            You lack permission to create a category.
          </div>
        </Card>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleMetadataChange = (e) => {
    try {
      JSON.parse(e.target.value);
      setFormData({
        ...formData,
        metadata: e.target.value,
      });
      if (validationErrors.metadata) {
        setValidationErrors({
          ...validationErrors,
          metadata: null,
        });
      }
    } catch (err) {
      setValidationErrors({
        ...validationErrors,
        metadata: "Invalid JSON format",
      });
      setFormData({
        ...formData,
        metadata: e.target.value,
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (formData.color && !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      errors.color = "Invalid color format (use #RRGGBB)";
    }
    try {
      JSON.parse(formData.metadata);
    } catch (err) {
      errors.metadata = "Invalid JSON format";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        metadata: JSON.parse(formData.metadata),
      };

      await categoryService.create(payload);
      navigate("/categories", {
        state: { success: "Category created successfully" },
      });
    } catch (err) {
      console.error("Error membuat kategori:", {
        message: err.message,
        response: err.response ? err.response.data : null,
        status: err.response ? err.response.status : null,
      });

      if (err.response && err.response.data && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError("Gagal membuat kategori. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Category"
        subtitle="Add a new project category"
        actionText="Back to Categories"
        actionPath="/categories"
      />

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      <Card>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="mb-4">
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
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="mb-4">
              <label
                htmlFor="color"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Color
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="#3b82f6"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.color ? "border-red-500" : "border-gray-300"
                }`}
              />
              {validationErrors.color && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.color}
                </p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="metadata"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Metadata (JSON)
              </label>
              <textarea
                id="metadata"
                name="metadata"
                value={formData.metadata}
                onChange={handleMetadataChange}
                rows="5"
                className={`font-mono w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.metadata
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              ></textarea>
              {validationErrors.metadata && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.metadata}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter additional metadata as JSON (e.g., icon, etc.)
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <Link
                to="/categories"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? <LoadingSpinner size="sm" /> : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default CategoryCreate;
