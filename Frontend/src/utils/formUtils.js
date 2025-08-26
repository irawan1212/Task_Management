import { debounce } from "lodash";

export const validateForm = (formData, projects) => {
  const errors = {};

  if (!formData.title?.trim()) errors.title = "Title is required";
  if (!formData.project_id) errors.project_id = "Project is required";
  else if (projects && !projects.some((p) => p.value === formData.project_id))
    errors.project_id = "Selected project is invalid";
  if (!formData.category_id) errors.category_id = "Category is required";
  if (!formData.user_id) errors.user_id = "Assignee is required";
  if (!formData.status) errors.status = "Status is required";
  if (!formData.priority) errors.priority = "Priority is required";

  try {
    if (formData.additional_info) {
      JSON.parse(formData.additional_info);
    }
  } catch (e) {
    errors.additional_info = "Additional info must be valid JSON";
  }

  return errors;
};

export const handleInputChange = (setFormData, setFieldErrors, e) => {
  const { name, value, type, checked } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
  setFieldErrors((prev) => ({ ...prev, [name]: "" }));
};

export const handleSelectChange = (
  setFormData,
  setFieldErrors,
  name,
  value
) => {
  setFormData((prev) => {
    const updatedData = { ...prev, [name]: value };
    if (name === "user_id" && value && prev.status === "pending") {
      updatedData.status = "in_progress";
    }
    return updatedData;
  });
  setFieldErrors((prev) => ({ ...prev, [name]: "" }));
};

export const handleFileChange = (setAttachment, setError) => (e) => {
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

export const debouncedSearch = debounce((callback, value) => {
  callback(value);
}, 300);
