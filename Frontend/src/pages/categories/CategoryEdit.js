import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { categoryService } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth

const CategoryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth(); // Get permission check function
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    metadata: "{}",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [audits, setAudits] = useState([]);
  const [showAudits, setShowAudits] = useState(false);

  // Fetch category data
  useEffect(() => {
    const fetchCategoryData = async () => {
      // Only fetch if user has 'update' permission
      if (!hasPermission("update")) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const category = await categoryService.getById(id);

        setFormData({
          name: category.name,
          description: category.description || "",
          is_active: category.is_active,
          metadata: JSON.stringify(category.metadata || {}, null, 2),
        });

        // Fetch audit data if user has 'read' permission
        if (hasPermission("read")) {
          try {
            const auditData = await categoryService.getAudits(id);
            setAudits(auditData);
          } catch (auditErr) {
            console.error("Error fetching audit data:", auditErr);
            // Non-critical error, don't show to user
          }
        }
      } catch (err) {
        console.error("Error fetching category:", err);
        setError("Failed to load category data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [id, hasPermission]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleMetadataChange = (e) => {
    try {
      const parsedJson = JSON.parse(e.target.value);
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

    try {
      JSON.parse(formData.metadata);
    } catch (err) {
      errors.metadata = "Invalid JSON format";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check update permission before proceeding
    if (!hasPermission("update")) {
      setError("You do not have permission to update categories.");
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        metadata: JSON.parse(formData.metadata),
      };

      await categoryService.update(id, payload);
      setSuccess("Category updated successfully");

      // Refresh audit trail if user has 'read' permission
      if (hasPermission("read")) {
        try {
          const auditData = await categoryService.getAudits(id);
          setAudits(auditData);
        } catch (auditErr) {
          console.error("Error refreshing audit data:", auditErr);
        }
      }
    } catch (err) {
      console.error("Error updating category:", err);

      if (err.response && err.response.data && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError("Failed to update category. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // If user lacks 'update' permission, show unauthorized message
  if (!hasPermission("update")) {
    return (
      <div>
        <PageHeader
          title="Unauthorized"
          subtitle="You do not have permission to edit categories."
          actionText="Back to Categories"
          actionPath="/categories"
        />
        <Card>
          <div className="p-6 text-center text-red-600">
            You lack permission to edit this category.
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Category"
        subtitle="Update category information"
        actionText="Back to Categories"
        actionPath="/categories"
      />

      <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />
      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      <Card className="mb-6">
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
                Enter additional metadata as JSON (e.g., color, icon, etc.)
              </p>
            </div>

            <div className="flex justify-between mt-6">
              {hasPermission("read") && ( // Show audit trail button only if user has 'read' permission
                <button
                  type="button"
                  onClick={() => setShowAudits(!showAudits)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {showAudits ? "Hide Audit Trail" : "Show Audit Trail"}
                </button>
              )}

              <div>
                <Link
                  to="/categories"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {saving ? <LoadingSpinner size="sm" /> : "Update Category"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Card>

      {hasPermission("read") &&
        showAudits && ( // Show audit trail only if user has 'read' permission
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Audit Trail
              </h2>
              {audits.length === 0 ? (
                <p className="text-gray-500">No audit records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date/Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {audits.map((audit, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(audit.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {audit.user ? audit.user.name : "System"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {audit.event}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {audit.old_values &&
                              Object.keys(audit.old_values).length > 0 && (
                                <div className="mb-2">
                                  <p className="font-medium">Old Values:</p>
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(audit.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            {audit.new_values &&
                              Object.keys(audit.new_values).length > 0 && (
                                <div>
                                  <p className="font-medium">New Values:</p>
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(audit.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}
    </div>
  );
};

export default CategoryEdit;
