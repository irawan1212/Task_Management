import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";

function EditProperty() {
  const { id } = useParams();
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

  useEffect(() => {
    const propertyRef = ref(database, `Property/${id}`);
    onValue(propertyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setProperty(data);
    });
  }, [id]);

  const handleChange = (e) => {
    setProperty({ ...property, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const propertyRef = ref(database, `Property/${id}`);
    update(propertyRef, property).then(() => navigate("/"));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Property</h2>
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
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Update
        </button>
      </form>
    </div>
  );
}

export default EditProperty;
