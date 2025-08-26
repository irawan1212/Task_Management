import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService, roleService } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CustomSelect from "../../components/common/Select";

const UserCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
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

  // Enhanced function to fetch roles with better debugging and error handling
  const fetchRoles = async () => {
    try {
      console.log("Fetching roles...");
      const response = await roleService.getAll();

      // Comprehensive logging for debugging
      
      let rolesData = [];

      // Handle multiple possible response structures
      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log("Using response.data.data structure");
        rolesData = response.data.data;
      } else if (response.data?.roles && Array.isArray(response.data.roles)) {
        console.log("Using response.data.roles structure");
        rolesData = response.data.roles;
      } else if (Array.isArray(response.data)) {
        console.log("Using direct array structure");
        rolesData = response.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        console.log("Using response.data.items structure");
        rolesData = response.data.items;
      } else if (response.data) {
        console.log("Checking for other possible structures...");

        // Check if response.data is a single role object
        if (response.data.id && (response.data.name || response.data.title)) {
          console.log("Single role object detected");
          rolesData = [response.data];
        } else {
          // Look for any array property that might contain roles
          const possibleArrays = Object.keys(response.data).filter(
            (key) =>
              Array.isArray(response.data[key]) && response.data[key].length > 0
          );
          console.log("Possible array properties found:", possibleArrays);

          if (possibleArrays.length > 0) {
            // Use the first array that contains objects with id/name properties
            for (const arrayKey of possibleArrays) {
              const firstItem = response.data[arrayKey][0];
              if (
                firstItem &&
                (firstItem.id || firstItem.name || firstItem.title)
              ) {
                console.log(`Using response.data.${arrayKey} structure`);
                rolesData = response.data[arrayKey];
                break;
              }
            }
          }
        }
      }

      console.log("Extracted roles data:", rolesData);
      console.log("Roles data length:", rolesData?.length || 0);

      // Ensure rolesData is an array
      if (!Array.isArray(rolesData)) {
        console.warn("Roles data is not an array, converting to empty array");
        rolesData = [];
      }

      // Log first few items for inspection
      if (rolesData.length > 0) {
        console.log("First role item:", rolesData[0]);
        console.log("Sample of role items:", rolesData.slice(0, 3));
      }

      // Enhanced mapping with multiple fallbacks for role names
      const roleOptions = rolesData
        .filter((role) => {
          const isValid =
            role &&
            typeof role === "object" &&
            (role.name ||
              role.title ||
              role.role_name ||
              role.label ||
              role.id);
          if (!isValid) {
            console.warn("Filtering out invalid role:", role);
          }
          return isValid;
        })
        .map((role) => {
          // Try multiple possible name fields
          const roleName =
            role.name ||
            role.title ||
            role.role_name ||
            role.label ||
            `Role ${role.id}`;

          return {
            value: roleName,
            label: roleName,
            id: role.id,
            // Keep original data for debugging
            original: role,
          };
        });

      console.log("Final processed role options:", roleOptions);
      console.log("Total role options count:", roleOptions.length);
      console.log("=== END ROLES DEBUG ===");

      setRoles(roleOptions);
      setRolesLoading(false);

      // Show warning if no roles found
      if (roleOptions.length === 0) {
        console.warn("No valid roles found in API response");
        setError("No roles available. Please contact administrator.");
      }

      return roleOptions;
    } catch (err) {
      console.error("Error fetching roles:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);

      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch roles";
      setError(errorMessage);
      setRolesLoading(false);
      throw err;
    }
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleRoleChange = (value) => {
    console.log("Role selection changed to:", value);
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

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
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

    setLoading(true);
    setError("");

    // Create payload with role name
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      role: formData.role, // Send role name directly
    };

    console.log("Submitting user creation with payload:", payload);

    try {
      const result = await userService.create(payload);
      console.log("User creation successful:", result);
      navigate("/users", { state: { success: "User created successfully" } });
    } catch (err) {
      console.error("User creation error:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to create user";
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  // Show loading spinner while roles are being fetched
  if (rolesLoading) {
    return (
      <div>
        <PageHeader
          title="Create User"
          subtitle="Add a new user to the system"
          actionText="Back to Users"
          actionPath="/users"
        />
        <Card>
          <div className="p-6 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600">Loading roles...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create User"
        subtitle="Add a new user to the system"
        actionText="Back to Users"
        actionPath="/users"
      />

      <Card>
        <div className="p-6">
          <ErrorAlert message={error} onDismiss={() => setError("")} />

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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter user's full name"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter user's email address"
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
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (minimum 8 characters)"
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
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password_confirmation
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Confirm the password"
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
              </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate("/users")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading || roles.length === 0}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default UserCreate;
