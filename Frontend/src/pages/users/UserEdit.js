// src/pages/users/UserEdit.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userService, roleService } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CustomSelect from "../../components/common/Select";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Function to fetch roles
  const fetchRoles = async () => {
    try {
      const rolesResponse = await roleService.getAll();

      // Handle different response structures
      let rolesData = [];
      if (rolesResponse.data?.data) {
        rolesData = rolesResponse.data.data;
      } else if (Array.isArray(rolesResponse.data)) {
        rolesData = rolesResponse.data;
      } else {
        console.warn(
          "Unexpected roles response structure:",
          rolesResponse.data
        );
        rolesData = [];
      }

      const roleOptions = rolesData.map((role) => ({
        value: role.name, // Use role name as value instead of ID
        label: role.name,
        id: role.id, // Keep ID for reference if needed
      }));

      console.log("Fetched roles:", roleOptions);
      setRoles(roleOptions);
      return roleOptions;
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      throw err;
    }
  };

  // Function to fetch user data
  const fetchUser = async (roleOptions) => {
    try {
      const userResponse = await userService.get(id);
      const userData = userResponse.data;

      console.log("Fetched user data:", userData);

      // Try to determine the user's current role
      let userRoleName = "";

      // Check if user has a role field directly
      if (userData.role) {
        userRoleName = userData.role;
      }
      // Check if user has role_id and we can find the matching role
      else if (userData.role_id && roleOptions.length > 0) {
        const matchingRole = roleOptions.find(
          (role) => role.id === userData.role_id
        );
        userRoleName = matchingRole ? matchingRole.value : "";
      }
      // Check if user has roles array (from relationship)
      else if (userData.roles && userData.roles.length > 0) {
        userRoleName = userData.roles[0].name;
      }

      console.log("Determined user role:", userRoleName);

      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        password: "",
        password_confirmation: "",
        role: userRoleName,
      });

      return userData;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      throw err;
    }
  };

  // Main fetch function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch roles first, then user data
      const roleOptions = await fetchRoles();
      await fetchUser(roleOptions);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh roles only
 

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password" && value !== "") {
      setPasswordChanged(true);
    }

    setFormData({ ...formData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleRoleChange = (value) => {
    console.log("Role changed to:", value);
    setFormData({ ...formData, role: value });

    // Clear error for role field
    if (errors.role) {
      setErrors({ ...errors, role: "" });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Only validate password if it has been changed
    if (passwordChanged) {
      if (formData.password.length > 0 && formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = "Passwords do not match";
      }
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    } else if (!roles.some((role) => role.value === formData.role)) {
      newErrors.role = "Invalid role selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    setError("");

    // Create update payload - send role name directly
    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role, // Send role name directly
    };

    // Only include password if it was changed
    if (passwordChanged && formData.password) {
      payload.password = formData.password;
      payload.password_confirmation = formData.password_confirmation;
    }

    console.log("Submitting user update with payload:", payload);

    try {
      await userService.update(id, payload);
      navigate("/users", { state: { success: "User updated successfully" } });
    } catch (err) {
      console.error("Update error:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || "Failed to update user");
      }
      setSaving(false);
    }
  };

  // Function to handle retry
  const handleRetry = () => {
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Edit User"
        subtitle="Update user information"
        actionText="Back to Users"
        actionPath="/users"
      />

      <Card>
        <div className="p-6">
          <ErrorAlert
            message={error}
            onDismiss={() => setError("")}
            showRetry={!!error}
            onRetry={handleRetry}
          />

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
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password{" "}
                <span className="text-gray-500 text-xs">
                  (leave blank to keep current password)
                </span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.password_confirmation
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.password_confirmation}
                onChange={handleChange}
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
               </div>
              <CustomSelect
                name="role"
                options={roles}
                value={formData.role}
                onChange={handleRoleChange}
                error={errors.role}
                required
                placeholder={
                  roles.length === 0 ? "No roles available" : "Select a role"
                }
              />
              {/* Debug info - remove in production */}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate("/users")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={saving }
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default UserEdit;
