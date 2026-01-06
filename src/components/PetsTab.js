import React from "react";
import PetForm from "./PetForm";

export default function PetsTab({ pets, newPet, setNewPet, handleAddPet }) {
  return (
    <div className="pets-section">
      <h3>My Pets</h3>
      {pets.length === 0 ? (
        <p>No pets added yet.</p>
      ) : (
        <ul className="pets-list">
          {pets.map((pet) => (
            <li key={pet.id}>
              {pet.name} ({pet.species}, {pet.breed}, {pet.age} yrs, {pet.gender})
            </li>
          ))}
        </ul>
      )}

      <PetForm newPet={newPet} setNewPet={setNewPet} handleAddPet={handleAddPet} />
    </div>
  );
}
