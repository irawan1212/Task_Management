// src/api/services.js
import api from "./axios";

// Auth services
export const authService = {
  login: (data) => api.post("/login", data),
  register: (data) => api.post("/register", data),
  logout: () => api.post("/logout"),
  getCurrentUser: () => api.get("/user"),
};

// Project services
export const projectService = {
  getAll: (params) => api.get("/projects", { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => {
    if (!data.name) {
      console.error("Missing required project name");
      return Promise.reject(new Error("Project name is required"));
    }

    const sanitizedData = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || "",
      budget: data.budget ? Number(data.budget) : null,
      manager_id: data.manager_id ? Number(data.manager_id) : null,
      metadata: {
        ...(data.metadata || {}),
        client_name: data.metadata?.client_name?.trim() || "",
        priority: data.metadata?.priority || "medium",
        notes: data.metadata?.notes?.trim() || "",
      },
    };

    console.log("Sending sanitized project data to API:", sanitizedData);

    return api
      .post("/projects", sanitizedData)
      .then((response) => {
        console.log("Project created successfully:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("Project creation API error:", error);
        if (error.response) {
          console.error("Error details:", {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        }
        throw error;
      });
  },
  update: (id, data) => {
    const sanitizedData = {
      ...data,
      name: data.name?.trim(),
      description: data.description?.trim(),
      budget: data.budget ? Number(data.budget) : null,
      manager_id: data.manager_id ? Number(data.manager_id) : null,
      metadata: {
        ...(data.metadata || {}),
        client_name: data.metadata?.client_name?.trim() || "",
        priority: data.metadata?.priority || "medium",
        notes: data.metadata?.notes?.trim() || "",
      },
    };

    return api.put(`/projects/${id}`, sanitizedData).catch((error) => {
      console.error(`Error updating project ${id}:`, error.response || error);
      throw error;
    });
  },
  delete: (id) => api.delete(`/projects/${id}`),
};

// Category services
export const categoryService = {
  getAll: (params = {}) => {
    console.log("Fetching categories with params:", params);
    return api
      .get("/categories", {
        params,
        timeout: 10000,
      })
      .then((response) => {
        console.log("Categories response:", response);
        return response;
      })
      .catch((error) => {
        console.error("Failed to fetch categories:", error);
        throw error;
      });
  },
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Task services
export const taskService = {
  getAll: (params) => api.get("/tasks", { params }),
  get: (id) => api.get(`/tasks/${id}`),

  create: (data) => {
    console.log("Task create - Original data:", data);

    const sanitizedData = {
      title: data.title?.trim(),
      description: data.description?.trim() || "",
      project_id: data.project_id ? Number(data.project_id) : null,
      category_id: data.category_id ? Number(data.category_id) : null,
      user_id: data.user_id ? Number(data.user_id) : null,
      assignee_id: data.assignee_id
        ? Number(data.assignee_id)
        : data.user_id
        ? Number(data.user_id)
        : null,
      due_date: data.due_date || null,
      is_completed: data.is_completed === true || data.is_completed === "true",
      status: data.status || (data.is_completed ? "completed" : "pending"),
      meta_data:
        typeof data.meta_data === "string"
          ? data.meta_data
          : JSON.stringify(data.meta_data || {}),
    };

    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === null || sanitizedData[key] === undefined) {
        delete sanitizedData[key];
      }
    });

    console.log("Task create - Sanitized data:", sanitizedData);

    return api.post("/tasks", sanitizedData).catch((error) => {
      console.error("Task creation API error:", error.response || error);
      throw error;
    });
  },

  update: (id, data) => {
    console.log(`Task update ${id} - Original data:`, data);

    if (data instanceof FormData) {
      console.log("Task update - Sending FormData with attachment");
      return api
        .put(`/tasks/${id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log(`Task update ${id} - Success response:`, response.data);
          return response;
        })
        .catch((error) => {
          console.error(`Task update ${id} - Error:`, error.response || error);
          throw error;
        });
    }

    const sanitizedData = {
      title: data.title?.trim(),
      description: data.description?.trim() || "",
      project_id: data.project_id ? Number(data.project_id) : undefined,
      category_id: data.category_id ? Number(data.category_id) : undefined,
      user_id: data.user_id ? Number(data.user_id) : undefined,
      assignee_id: data.assignee_id
        ? Number(data.assignee_id)
        : data.user_id
        ? Number(data.user_id)
        : undefined,
      due_date: data.due_date || null,
      is_completed: data.is_completed === true || data.is_completed === "true",
      status: data.status || undefined,
      meta_data:
        typeof data.meta_data === "string"
          ? data.meta_data
          : JSON.stringify(data.meta_data || {}),
    };

    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === undefined) {
        delete sanitizedData[key];
      }
    });

    console.log(`Task update ${id} - Sanitized data:`, sanitizedData);

    return api
      .put(`/tasks/${id}`, sanitizedData)
      .then((response) => {
        console.log(`Task update ${id} - Success response:`, response.data);
        return response;
      })
      .catch((error) => {
        console.error(`Task update ${id} - Error:`, error.response || error);
        if (error.response) {
          console.error(`Task update ${id} - Error details:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          });
        }
        throw error;
      });
  },

  delete: (id) => api.delete(`/tasks/${id}`),

  uploadAttachment: (id, file, retryCount = 0) => {
    const maxRetries = 3;
    const formData = new FormData();
    formData.append("attachment", file);

    return api
      .post(`/tasks/${id}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      })
      .then((response) => {
        console.log(
          `Attachment upload for task ${id} successful:`,
          response.data
        );
        return response;
      })
      .catch((error) => {
        console.error(
          `Attachment upload for task ${id} failed:`,
          error.response || error
        );
        if (error.response) {
          console.error(`Attachment upload error details:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          });
        }

        if (
          retryCount < maxRetries &&
          (!error.response || error.response.status >= 500)
        ) {
          console.log(
            `Retrying attachment upload for task ${id} (Attempt ${
              retryCount + 2
            })`
          );
          return taskService.uploadAttachment(id, file, retryCount + 1);
        }

        throw error;
      });
  },

  getAudits: (id) => api.get(`/tasks/${id}/audits`),
};

// Role services
export const roleService = {
  getAll: (params) => api.get("/roles", { params }),
  get: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post("/roles", data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

// User services
export const userService = {
  getAll: (params) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => {
    const sanitizedData = {
      ...data,
      first_name: data.first_name?.trim(),
      last_name: data.last_name?.trim(),
      email: data.email?.trim().toLowerCase(),
    };

    return api.post("/users", sanitizedData).catch((error) => {
      console.error("User creation API error:", error.response || error);
      throw error;
    });
  },
  update: (id, data) => {
    const sanitizedData = {
      ...data,
      first_name: data.first_name?.trim(),
      last_name: data.last_name?.trim(),
      email: data.email?.trim().toLowerCase(),
    };

    return api.put(`/users/${id}`, sanitizedData).catch((error) => {
      console.error(`Error updating user ${id}:`, error.response || error);
      throw error;
    });
  },
  delete: (id) => api.delete(`/users/${id}`),
};

// Import/Export services
export const importExportService = {
  importTasks: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/import/tasks", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  exportTasks: (params) =>
    api.get("/export/tasks", {
      params,
      responseType: "blob",
    }),
};
