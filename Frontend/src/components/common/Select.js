import React, { useEffect, useState } from "react";
import Select from "react-select";

const CustomSelect = ({
  options = [],
  onChange,
  value,
  isMulti = false,
  placeholder = "Select...",
  isLoading = false,
  name,
  label,
  error,
  required = false,
  isDisabled = false,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    // Convert value to the format expected by react-select
    if (value) {
      if (isMulti) {
        const selected = options.filter((option) =>
          value.includes(option.value)
        );
        setSelectedOption(selected);
      } else {
        const selected = options.find((option) => option.value === value);
        setSelectedOption(selected || null);
      }
    } else {
      setSelectedOption(isMulti ? [] : null);
    }
  }, [value, options, isMulti]);

  const handleChange = (selected) => {
    setSelectedOption(selected);
    if (onChange) {
      if (isMulti) {
        onChange(selected ? selected.map((item) => item.value) : []);
      } else {
        onChange(selected ? selected.value : null);
      }
    }
  };

  // Custom styles for react-select to improve UI/UX
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderWidth: "1px",
      borderColor: error ? "#f56565" : state.isFocused ? "#3b82f6" : "#d1d5db",
      borderRadius: "0.375rem",
      backgroundColor: isDisabled ? "#f4f4f5" : "#ffffff",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
      "&:hover": {
        borderColor: error
          ? "#f56565"
          : state.isFocused
          ? "#3b82f6"
          : "#9ca3af",
      },
      transition: "all 0.2s ease-in-out",
      fontSize: "0.875rem",
      padding: "0 0.5rem",
      cursor: "pointer", // Add cursor pointer
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6b7280",
      fontSize: "0.875rem",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#111827",
      fontSize: "0.875rem",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.375rem",
      marginTop: "0.25rem",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
      zIndex: 1000, // Increased z-index to ensure menu appears above other elements
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: "200px", // Ensure proper scrolling
      padding: 0,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "#ffffff",
      color: state.isSelected ? "#ffffff" : "#111827",
      padding: "0.5rem 0.75rem",
      fontSize: "0.875rem",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
      },
      transition: "background-color 0.2s ease-in-out",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#6b7280",
      "&:hover": {
        color: "#374151",
      },
      cursor: "pointer",
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "#6b7280",
      "&:hover": {
        color: "#374151",
      },
      cursor: "pointer",
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "#d1d5db",
    }),
  };

  return (
    <div className="relative mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Select
        id={name}
        name={name}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        isMulti={isMulti}
        placeholder={placeholder}
        isLoading={isLoading}
        isDisabled={isDisabled || isLoading}
        className="basic-select"
        classNamePrefix="select"
        styles={customStyles}
        // Key properties to ensure dropdown shows all options
        isSearchable={true} // Enable search but don't require it
        filterOption={null} // This ensures all options show initially
        menuIsOpen={undefined} // Let react-select handle menu state
        openMenuOnClick={true} // Open menu when clicked
        openMenuOnFocus={true} // Open menu when focused
        // Accessibility improvements
        aria-label={label || placeholder}
        isClearable={!required}
        noOptionsMessage={() => "No options available"}
        // Menu positioning for better UX
        menuPlacement="auto"
        menuPortalTarget={document.body} // Portal menu to body to avoid z-index issues
        maxMenuHeight={200}
        // Ensure filtering works properly
        ignoreCase={true}
        ignoreAccents={true}
      />
      {error && <p className="mt-1 text-sm text-red-600 absolute">{error}</p>}
      {isLoading && (
        <div className="absolute right-8 top-10 pointer-events-none">
          <svg
            className="animate-spin h-4 w-4 text-blue-600"
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
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
