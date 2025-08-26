// src/pages/roles/RoleEdit.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roleService } from "../../api/services";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const RoleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {
      create: false,
      read: false,
      update: false,
      delete: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const response = await roleService.get(id);
        const { name, description, permissions } = response.data;
        setFormData({
          name,
          description,
          permissions: permissions || {
            create: false,
            read: false,
            update: false,
            delete: false,
          },
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch role");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when field is modified
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setValidationErrors({});

    try {
      await roleService.update(id, formData);
      navigate("/roles", { state: { success: "Role updated successfully" } });
    } catch (err) {
      if (err.response?.status === 422) {
        // Validation errors
        setValidationErrors(err.response.data.errors || {});
      } else {
        setError(err.response?.data?.message || "Failed to update role");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/roles");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Role" subtitle="Update role details" />

      <Card>
        <div className="p-6">
          <ErrorAlert message={error} onDismiss={() => setError("")} />

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.name
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                required
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.name[0]}
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
                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.description
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.description[0]}
                </p>
              )}
            </div>

            <div className="mb-6">
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </legend>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="create"
                      name="create"
                      checked={formData.permissions.create}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="create"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Create
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="read"
                      name="read"
                      checked={formData.permissions.read}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="read"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Read
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="update"
                      name="update"
                      checked={formData.permissions.update}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="update"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Update
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="delete"
                      name="delete"
                      checked={formData.permissions.delete}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="delete"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Delete
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {saving ? <LoadingSpinner size="sm" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default RoleEdit;
