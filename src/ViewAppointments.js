import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ViewAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      const q = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      setAppointments(querySnapshot.docs.map((doc) => doc.data()));
    };
    fetchAppointments();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
          My Appointments
        </h1>

        {appointments.length === 0 ? (
          <p className="text-center text-gray-600">No appointments yet.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <p>
                  <strong>Pet:</strong> {appt.petName}
                </p>
                <p>
                  <strong>Service:</strong> {appt.service}
                </p>
                <p>
                  <strong>Date:</strong> {appt.date} — <strong>Time:</strong>{" "}
                  {appt.time}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-8 w-full bg-gray-700 hover:bg-gray-800 text-white p-3 rounded-xl transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ViewAppointments;
