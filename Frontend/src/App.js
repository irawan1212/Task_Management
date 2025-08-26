import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/routes/ProtectedRoute";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";

// Dashboard pages
import DashboardPage from "./pages/dashboard/DashboardPage";

// Project pages
import ProjectList from "./pages/projects/ProjectList";
import ProjectCreate from "./pages/projects/ProjectCreate";
import ProjectEdit from "./pages/projects/ProjectEdit";
import ProjectView from "./pages/projects/ProjectView";

// Category pages
import CategoryList from "./pages/categories/CategoryList";
import CategoryCreate from "./pages/categories/CategoryCreate";
import CategoryEdit from "./pages/categories/CategoryEdit";

// Task pages
import TaskList from "./pages/tasks/TaskList";
import TaskCreate from "./pages/tasks/TaskCreate";
import TaskEdit from "./pages/tasks/TaskEdit";
import TaskView from "./pages/tasks/TaskView";

// Role management pages
import RoleList from "./pages/roles/RoleList";
import RoleCreate from "./pages/roles/RoleCreate";
import RoleEdit from "./pages/roles/RoleEdit";

// User management pages (admin only)
import UserList from "./pages/users/UserList";
import UserCreate from "./pages/users/UserCreate";
import UserEdit from "./pages/users/UserEdit";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected (authenticated) routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/create" element={<ProjectCreate />} />
            <Route path="/projects/:id/edit" element={<ProjectEdit />} />
            <Route path="/projects/:id" element={<ProjectView />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/categories/create" element={<CategoryCreate />} />
            <Route path="/categories/:id/edit" element={<CategoryEdit />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/create" element={<TaskCreate />} />
            <Route path="/tasks/:id/edit" element={<TaskEdit />} />
            <Route path="/tasks/:id" element={<TaskView />} />
            <Route path="/roles" element={<RoleList />} />
            <Route path="/roles/create" element={<RoleCreate />} />
            <Route path="/roles/:id/edit" element={<RoleEdit />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/users" element={<UserList />} />
            <Route path="/users/create" element={<UserCreate />} />
            <Route path="/users/:id/edit" element={<UserEdit />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


export default App;
