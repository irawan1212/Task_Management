import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { Link } from "react-router-dom";

function PropertyList() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const propertiesRef = ref(database, "Property");
    onValue(propertiesRef, (snapshot) => {
      const data = snapshot.val();
      const propertyList = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setProperties(propertyList);
    });
  }, []);

  return (
    <div>
      <Link
        to="/add"
        className="bg-blue-500 text-white p-2 rounded mb-4 inline-block"
      >
        Add Property
      </Link>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td className="border p-2">{property.id}</td>
              <td className="border p-2">{property.NameProperty}</td>
              <td className="border p-2">{property.Price}</td>
              <td className="border p-2">
                <Link to={`/edit/${property.id}`} className="text-blue-500">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PropertyList;
