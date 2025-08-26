import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "../firebase";
import { useNavigate } from "react-router-dom";

function AddProperty() {
  const [property, setProperty] = useState({
    NameProperty: "",
    UrlImageProperty: "",
    Rating: "",
    Price: "",
    AddressProperty: "",
    Description: "",
    IdRoom: "",
    IdPromo: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setProperty({ ...property, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPropertyRef = push(ref(database, "Property"));
    push(newPropertyRef, property).then(() => navigate("/"));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add Property</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="NameProperty"
          value={property.NameProperty}
          onChange={handleChange}
          placeholder="Name"
          className="border p-2 w-full"
        />
        <input
          name="UrlImageProperty"
          value={property.UrlImageProperty}
          onChange={handleChange}
          placeholder="Image URL"
          className="border p-2 w-full"
        />
        <input
          name="Rating"
          value={property.Rating}
          onChange={handleChange}
          placeholder="Rating"
          className="border p-2 w-full"
        />
        <input
          name="Price"
          value={property.Price}
          onChange={handleChange}
          placeholder="Price"
          className="border p-2 w-full"
        />
        <input
          name="AddressProperty"
          value={property.AddressProperty}
          onChange={handleChange}
          placeholder="Address"
          className="border p-2 w-full"
        />
        <input
          name="Description"
          value={property.Description}
          onChange={handleChange}
          placeholder="Description"
          className="border p-2 w-full"
        />
        <input
          name="IdRoom"
          value={property.IdRoom}
          onChange={handleChange}
          placeholder="Room ID"
          className="border p-2 w-full"
        />
        <input
          name="IdPromo"
          value={property.IdPromo}
          onChange={handleChange}
          placeholder="Promo ID"
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}

export default AddProperty;
