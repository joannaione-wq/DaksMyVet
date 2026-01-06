import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function BookAppointment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    petName: "",
    service: "",
    date: "",
    time: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return alert("Please log in first!");

      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        ...form,
        createdAt: Timestamp.now(),
      });

      alert("Appointment booked successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error booking appointment:", err);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Book an Appointment
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="petName"
            placeholder="Pet Name"
            value={form.petName}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />
          <input
            name="service"
            placeholder="Service (e.g. Check-up)"
            value={form.service}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition"
          >
            Book Appointment
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookAppointment;
