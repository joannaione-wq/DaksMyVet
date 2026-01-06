import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./MyPets.css";
import { PawPrint, Trash2, RefreshCcw } from "lucide-react";

const MyPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const petsCollection = collection(db, "pets");
        const petSnapshot = await getDocs(petsCollection);
        const petList = petSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPets(petList);
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []); // ✅ clean, no warning now

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "pets", id));
      setPets(pets.filter((pet) => pet.id !== id));
    } catch (error) {
      console.error("Error deleting pet:", error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const petsCollection = collection(db, "pets");
      const petSnapshot = await getDocs(petsCollection);
      const petList = petSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPets(petList);
    } catch (error) {
      console.error("Error refreshing pets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="mypets-loading">Loading pets...</div>;
  }

  return (
    <div className="mypets-container">
      <h2 className="mypets-title">
        <PawPrint className="mypets-icon" /> My Registered Pets
      </h2>

      <button className="refresh-btn" onClick={handleRefresh}>
        <RefreshCcw size={16} /> Refresh
      </button>

      {pets.length === 0 ? (
        <p className="mypets-empty">No pets found. Register your first pet!</p>
      ) : (
        <div className="mypets-list">
          {pets.map((pet) => (
            <div className="pet-card" key={pet.id}>
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <p>
                  <strong>Type:</strong> {pet.type}
                </p>
                <p>
                  <strong>Breed:</strong> {pet.breed}
                </p>
                <p>
                  <strong>Age:</strong> {pet.age}
                </p>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(pet.id)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPets;
