import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoryService } from "../../api/services";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import Pagination from "../../components/common/Pagination";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        sort_by: sortField, // Changed from sort_field to sort_by to match backend
        sort_direction: sortDirection,
        search: searchTerm,
      };

      const response = await categoryService.getAll(params);

      // Handle Laravel's default pagination structure
      setCategories(response.data.data || response.data);

      // Extract pagination data
      if (response.data.meta) {
        // Handle if meta exists (original expected format)
        setPagination({
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          total: response.data.meta.total,
        });
      } else if (response.data.current_page) {
        // Handle Laravel's default pagination structure
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total,
        });
      } else {
        // Fallback if no pagination info is available
        setPagination({
          current_page: 1,
          last_page: 1,
          total: Array.isArray(response.data) ? response.data.length : 0,
        });
      }
    } catch (err) {
      setError("Failed to load categories. Please try again.");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [sortField, sortDirection]);

  const handlePageChange = (page) => {
    fetchCategories(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCategories(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryService.delete(id);
        setSuccess("Category deleted successfully");
        fetchCategories(pagination.current_page);
      } catch (err) {
        setError("Failed to delete category. Please try again.");
        console.error("Error deleting category:", err);
      }
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage your project categories"
        actionText="Create Category"
        actionPath="/categories/create"
      />

      <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />
      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      <Card>
        <div className="p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </form>

          {loading ? (
            <LoadingSpinner />
          ) : categories.length === 0 ? (
            <div className="text-center py-4">No categories found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      Name {renderSortIcon("name")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("color")}
                    >
                      Color {renderSortIcon("color")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("is_active")}
                    >
                      Status {renderSortIcon("is_active")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      Created At {renderSortIcon("created_at")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="w-6 h-6 rounded"
                          style={{
                            backgroundColor: category.color || "#CBD5E0",
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/categories/${category.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </Card>
    </div>
  );
};

export default CategoryList;
