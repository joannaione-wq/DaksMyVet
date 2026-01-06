import React from "react";

export default function AppointmentsTab({ appointments, handleReschedule, handleCancel }) {
  return (
    <div className="appointments-section">
      <h3>My Upcoming Appointments</h3>
      {appointments.length === 0 ? (
        <p>No upcoming appointments.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pet</th>
              <th>Service</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td>{appt.petName}</td>
                <td>{appt.service}</td>
                <td>{appt.dateTime}</td>
                <td>{appt.status}</td>
                <td>
                  <button
                    onClick={() => {
                      const newSlot = prompt("Enter new slot (YYYY-MM-DD HH:mm):", appt.dateTime);
                      if (!newSlot) return;
                      handleReschedule(appt.id, newSlot);
                    }}
                  >
                    Reschedule
                  </button>
                  <button onClick={() => handleCancel(appt.id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
