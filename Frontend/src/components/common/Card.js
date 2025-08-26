import React from "react";

const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default Card;
