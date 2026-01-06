import React from "react";

export default function PetForm({ newPet, setNewPet, handleAddPet }) {
  return (
    <div className="add-pet-form">
      <h4>Add New Pet</h4>
      <form onSubmit={handleAddPet}>
        <input
          type="text"
          placeholder="Name"
          value={newPet.name}
          onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Species"
          value={newPet.species}
          onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
        />
        <input
          type="text"
          placeholder="Breed"
          value={newPet.breed}
          onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
        />
        <input
          type="number"
          placeholder="Age"
          value={newPet.age}
          onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
        />
        <select
          value={newPet.gender}
          onChange={(e) => setNewPet({ ...newPet, gender: e.target.value })}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <button type="submit">Add Pet</button>
      </form>
    </div>
  );
}
