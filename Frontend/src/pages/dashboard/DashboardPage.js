import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { projectService, taskService } from "../../api/services";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Improved data extraction function
  const extractProjectsFromResponse = (response) => {
    console.log("🔍 Extracting projects from response:", response);

    if (!response) {
      console.log("❌ No response provided");
      return [];
    }

    // Direct array response
    if (Array.isArray(response)) {
      console.log("✅ Response is direct array:", response.length, "items");
      return response;
    }

    // Response with data wrapper
    if (response.data) {
      // Direct data array
      if (Array.isArray(response.data)) {
        console.log(
          "✅ Response.data is array:",
          response.data.length,
          "items"
        );
        return response.data;
      }

      // Nested data patterns
      const possibleArrays = [
        response.data.data,
        response.data.projects,
        response.data.items,
        response.data.results,
      ];

      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          console.log("✅ Found projects array:", arr.length, "items");
          return arr;
        }
      }

      // If response.data is an object, look for any array property
      if (typeof response.data === "object" && response.data !== null) {
        const keys = Object.keys(response.data);
        console.log("🔍 Searching in response.data keys:", keys);

        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            console.log(
              `✅ Found array in ${key}:`,
              response.data[key].length,
              "items"
            );
            return response.data[key];
          }
        }
      }
    }

    console.log("❌ No array found in response structure");
    return [];
  };

  // Improved project validation and processing
  const processProjects = (rawProjects) => {
    console.log("🔄 Processing", rawProjects.length, "raw projects");

    if (!Array.isArray(rawProjects)) {
      console.warn("⚠️ Raw projects is not an array:", rawProjects);
      return [];
    }

    const validProjects = rawProjects.filter((project) => {
      const isValid =
        project &&
        (project.id || project._id) &&
        (project.name || project.title);

      if (!isValid) {
        console.warn("⚠️ Invalid project filtered out:", project);
      }

      return isValid;
    });

    console.log("✅ Valid projects:", validProjects.length);

    return validProjects.map((project) => ({
      id: project.id || project._id,
      name: project.name || project.title,
      status: project.status || "active",
      tasks_count: project.tasks_count || project.tasksCount || 0,
      completed_tasks_count:
        project.completed_tasks_count || project.completedTasksCount || 0,
      created_at:
        project.created_at || project.createdAt || new Date().toISOString(),
      updated_at:
        project.updated_at || project.updatedAt || new Date().toISOString(),
      start_date: project.start_date || project.startDate,
      end_date: project.end_date || project.endDate,
    }));
  };

  // Extract tasks from response
  const extractTasksFromResponse = (response) => {
    console.log("🔍 Extracting tasks from response:", response);

    if (!response) return [];

    if (Array.isArray(response)) {
      return response;
    }

    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }

      const possibleArrays = [
        response.data.data,
        response.data.tasks,
        response.data.items,
        response.data.results,
      ];

      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          console.log("✅ Found tasks array:", arr.length, "items");
          return arr;
        }
      }
    }

    return [];
  };

  // Function to fetch tasks for a specific project
  const fetchProjectTasks = async (projectId) => {
    try {
      console.log(`📋 Fetching tasks for project ${projectId}...`);

      const response = await taskService.getAll({
        project_id: parseInt(projectId),
      });

      let tasksData = extractTasksFromResponse(response);

      // Filter tasks to ensure they belong to this project
      const projectTasks = tasksData.filter((task) => {
        const taskProjectId = task.project_id;
        const currentProjectId = parseInt(projectId);
        return taskProjectId === currentProjectId;
      });

      console.log(
        `✅ Found ${projectTasks.length} tasks for project ${projectId}`
      );

      return projectTasks;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch tasks for project ${projectId}:`, error);
      return [];
    }
  };

  // Function to get project task statistics with better completion detection
  const getProjectTaskStats = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter((task) => {
      // Check multiple ways a task can be completed
      return (
        task.is_completed === true ||
        task.is_completed === 1 ||
        (task.status &&
          (task.status.toLowerCase() === "completed" ||
            task.status.toLowerCase() === "done" ||
            task.status.toLowerCase() === "finished"))
      );
    }).length;

    return {
      total,
      completed,
      pending: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  // Format date function
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Main data fetching function with improved error handling
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Starting dashboard data fetch...");

      // Step 1: Fetch all projects with multiple fallback strategies
      console.log("📊 Fetching projects...");
      let allProjects = [];
      let projectsResponse = null;

      try {
        // Try different approaches to fetch projects with higher limits
        const fetchStrategies = [
          () => projectService.getAll({ per_page: 1000, page: 1 }),
          () => projectService.getAll({ limit: 1000 }),
          () => projectService.getAll({ page: 1, per_page: 500 }),
          () => projectService.getAll({ limit: 500 }),
          () => projectService.getAll({}),
          () => projectService.getAll(),
        ];

        for (let i = 0; i < fetchStrategies.length; i++) {
          try {
            console.log(`📊 Trying fetch strategy ${i + 1}...`);
            projectsResponse = await fetchStrategies[i]();
            console.log(`✅ Strategy ${i + 1} succeeded:`, projectsResponse);
            break;
          } catch (strategyError) {
            console.warn(`⚠️ Strategy ${i + 1} failed:`, strategyError.message);
            if (i === fetchStrategies.length - 1) {
              throw strategyError;
            }
          }
        }

        if (projectsResponse) {
          const extractedProjects =
            extractProjectsFromResponse(projectsResponse);
          allProjects = processProjects(extractedProjects);
          console.log(
            "✅ Successfully processed projects:",
            allProjects.length
          );
        }
      } catch (projectError) {
        console.error("❌ All project fetch strategies failed:", projectError);
        setError(`Failed to fetch projects: ${projectError.message}`);
        allProjects = [];
      }

      // Step 2: Fetch all tasks for global statistics with higher limits
      console.log("📊 Fetching all tasks for global stats...");
      let allTasks = [];
      let globalTasksStats = {
        total: 0,
        completed: 0,
        pending: 0,
        in_progress: 0,
      };

      try {
        const taskFetchStrategies = [
          () => taskService.getAll({ per_page: 2000, page: 1 }),
          () => taskService.getAll({ limit: 2000 }),
          () => taskService.getAll({ per_page: 1000 }),
          () => taskService.getAll({ limit: 1000 }),
          () => taskService.getAll(),
        ];

        let tasksResponse = null;
        for (let i = 0; i < taskFetchStrategies.length; i++) {
          try {
            console.log(`📊 Trying task fetch strategy ${i + 1}...`);
            tasksResponse = await taskFetchStrategies[i]();
            console.log(`✅ Task strategy ${i + 1} succeeded:`, tasksResponse);
            break;
          } catch (strategyError) {
            console.warn(
              `⚠️ Task strategy ${i + 1} failed:`,
              strategyError.message
            );
            if (i === taskFetchStrategies.length - 1) {
              throw strategyError;
            }
          }
        }

        if (tasksResponse) {
          allTasks = extractTasksFromResponse(tasksResponse);
          console.log("✅ Extracted tasks:", allTasks.length);

          // Calculate global task statistics with improved completion detection
          globalTasksStats.total = allTasks.length;
          allTasks.forEach((task) => {
            if (
              task.is_completed === true ||
              task.is_completed === 1 ||
              (task.status &&
                (task.status.toLowerCase() === "completed" ||
                  task.status.toLowerCase() === "done" ||
                  task.status.toLowerCase() === "finished"))
            ) {
              globalTasksStats.completed++;
            } else {
              globalTasksStats.pending++;
            }
          });
        }
      } catch (taskError) {
        console.warn("⚠️ Failed to fetch tasks:", taskError);
        // Don't fail the entire dashboard if tasks fail
      }

      // Step 3: Fetch tasks for each project and calculate individual stats
      console.log("📊 Fetching individual project task data...");

      // Process more projects for recent display (up to 10)
      const projectsToProcess = allProjects.slice(0, 10);

      const projectsWithTaskData = await Promise.all(
        projectsToProcess.map(async (project) => {
          const projectTasks = await fetchProjectTasks(project.id);
          const taskStats = getProjectTaskStats(projectTasks);

          return {
            id: project.id,
            name: project.name,
            status: project.status,
            tasksCount: taskStats.total,
            completedCount: taskStats.completed,
            pendingCount: taskStats.pending,
            completionRate: taskStats.completionRate,
            updatedAt: new Date(project.updated_at),
            tasks: projectTasks, // Store tasks for potential future use
          };
        })
      );

      // Step 4: Set dashboard statistics
      const dashboardStats = {
        totalProjects: allProjects.length,
        totalTasks: globalTasksStats.total,
        completedTasks: globalTasksStats.completed,
        pendingTasks: globalTasksStats.pending,
      };

      console.log("📊 Final dashboard stats:", dashboardStats);
      setStats(dashboardStats);

      // Step 5: Set recent projects with accurate task data (sort by updated date)
      const sortedProjects = projectsWithTaskData.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      console.log("✅ Setting recent projects with task data:", sortedProjects);
      setRecentProjects(sortedProjects);

      setLoading(false);
      console.log("✅ Dashboard data fetch completed successfully");
    } catch (err) {
      console.error("❌ Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard data...");
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []); // Empty dependency array

  // Manual refresh function
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Selamat datang kembali, {user?.name || "Pengguna"}!
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={handleRefresh}
                  className="text-sm text-red-600 hover:text-red-500 underline"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-3xl font-bold">
                {stats.totalProjects}
              </div>
              <div className="text-gray-500 mt-1">Total Proyek</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/projects"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Lihat semua proyek →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-3xl font-bold">
                {stats.totalTasks}
              </div>
              <div className="text-gray-500 mt-1">Total Tugas</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/tasks"
              className="text-sm text-green-600 hover:text-green-800"
            >
              Lihat semua tugas →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 text-3xl font-bold">
                {stats.completedTasks}
              </div>
              <div className="text-gray-500 mt-1">Tugas Selesai</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/tasks?status=completed"
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Lihat tugas selesai →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-600 text-3xl font-bold">
                {stats.pendingTasks}
              </div>
              <div className="text-gray-500 mt-1">Tugas Belum Selesai</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/tasks?status=pending"
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              Lihat tugas belum selesai →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Proyek Terbaru
            </h2>
            <div className="flex space-x-3">
              <Link
                to="/projects/create"
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Buat Proyek
              </Link>
              <Link
                to="/projects"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Lihat semua
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <div
                key={project.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-md font-medium text-gray-900 hover:text-blue-600"
                    >
                      {project.name}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1">
                      {project.completedCount} dari {project.tasksCount} tugas
                      selesai
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Terakhir diperbarui: {formatDate(project.updatedAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {project.completionRate}% selesai
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${
                          project.completionRate === 100
                            ? "bg-green-600"
                            : project.completionRate > 0
                            ? "bg-blue-600"
                            : "bg-gray-300"
                        }`}
                        style={{
                          width: `${project.completionRate}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="mt-4 text-gray-500">
                Belum ada proyek yang dibuat.
              </p>
              <Link
                to="/projects/create"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Buat proyek pertama Anda
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
