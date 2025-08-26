// src/components/common/CategorySelect.js
import React, { useState, useEffect } from "react";
import { categoryService } from "../../api/services";
import LoadingSpinner from "./LoadingSpinner";

const CategorySelect = ({ value, onChange, placeholder, className }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll();
      setCategories(response.data.data || response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch categories");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-gray-500">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 border border-red-300 bg-red-50 text-red-500 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <select
      className={
        className ||
        "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      }
      value={value}
      onChange={onChange}
    >
      <option value="">{placeholder || "Select a category"}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategorySelect;
