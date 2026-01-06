// src/GroomerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy
} from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  PawPrint,
  LogOut,
  Scissors,
  Sparkles,
  Calendar,
  Users
} from "lucide-react";
import "./GroomerDashboard.css";

export default function GroomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------- AUTH --------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
      } else {
        setUser(u);
        await fetchGroomingAppointments();
      }
    });
    return () => unsub();
  }, [navigate]);

  // -------------------- FETCH GROOMING APPOINTMENTS --------------------
  const fetchGroomingAppointments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "appointments"), orderBy("dateTime", "asc"));
      const snap = await getDocs(q);
      
      // Filter: only Grooming service appointments assigned to this groomer
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.service === "Grooming" && a.groomerId === auth.currentUser.uid);
      
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching grooming appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- APPOINTMENT ACTIONS --------------------
  const completeAppointment = async (id) => {
    if (!window.confirm("Mark this grooming appointment as completed?")) return;
    
    try {
      await updateDoc(doc(db, "appointments", id), { 
        status: "Completed" 
      });
      await fetchGroomingAppointments();
    } catch (error) {
      console.error("Error completing appointment:", error);
      alert("Failed to update appointment status.");
    }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm("Cancel this grooming appointment?")) return;
    
    try {
      await updateDoc(doc(db, "appointments", id), { 
        status: "Cancelled" 
      });
      await fetchGroomingAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment.");
    }
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // -------------------- STATS CALCULATION --------------------
  const pendingCount = appointments.filter(a => a.status === "Pending").length;
  const confirmedCount = appointments.filter(a => a.status === "Confirmed").length;
  const completedCount = appointments.filter(a => a.status === "Completed").length;

  // -------------------- RENDER --------------------
  return (
    <div className="groomer-dashboard">
      <aside className="sidebar">
        <div className="logo">
          <Scissors size={28} /> Dak's My Vet
        </div>

        {/* Profile Section */}
        {user && (
          <div className="groomer-profile">
            <img
              src="https://i.pinimg.com/736x/f1/d8/6b/f1d86ba0409995abe2dc737ea23027fe.jpg"
              alt="Groomer Profile"
              className="profile-pic"
            />
            <div className="profile-info">
              <h4>{user.displayName || "Groomer"}</h4>
              <p>{user.email}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          <Sparkles size={18} />
          Dashboard
        </button>
        <button
          className={activeTab === "appointments" ? "active" : ""}
          onClick={() => setActiveTab("appointments")}
        >
          <Calendar size={18} />
          Appointments
        </button>

        {/* Logout */}
        <button className="logout-btn" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main">
        {activeTab === "dashboard" && (
          <section>
            <h2>Welcome, {user?.displayName || "Groomer"}!</h2>
            <p className="subtitle">Manage your grooming appointments</p>
            
            <div className="stats">
              <div className="stat-card">
                <Scissors size={32} className="stat-icon" />
                <h4>Total Appointments</h4>
                <p>{appointments.length}</p>
              </div>
              <div className="stat-card pending">
                <Calendar size={32} className="stat-icon" />
                <h4>Pending</h4>
                <p>{pendingCount}</p>
              </div>
              <div className="stat-card confirmed">
                <Users size={32} className="stat-icon" />
                <h4>Confirmed</h4>
                <p>{confirmedCount}</p>
              </div>
              <div className="stat-card completed">
                <Sparkles size={32} className="stat-icon" />
                <h4>Completed</h4>
                <p>{completedCount}</p>
              </div>
            </div>

            {/* Upcoming Appointments Preview */}
            <div className="upcoming-section">
              <h3>Upcoming Appointments</h3>
              {appointments.filter(a => a.status === "Confirmed").slice(0, 3).length > 0 ? (
                <div className="appointment-cards">
                  {appointments
                    .filter(a => a.status === "Confirmed")
                    .slice(0, 3)
                    .map(a => (
                      <div key={a.id} className="appointment-card">
                        <div className="card-header">
                          <PawPrint size={20} />
                          <span className="pet-name">{a.petName}</span>
                        </div>
                        <div className="card-body">
                          <p><strong>Owner:</strong> {a.ownerName}</p>
                          <p><strong>Date & Time:</strong> {a.dateTime}</p>
                          <p><strong>Service:</strong> {a.service}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="no-data">No upcoming confirmed appointments</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "appointments" && (
          <section>
            <h2>Grooming Appointments</h2>
            <p className="subtitle">View and manage all your grooming appointments</p>
            
            {loading ? (
              <p className="loading">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="no-data">No grooming appointments found</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Pet Name</th>
                      <th>Owner</th>
                      <th>Date & Time</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="pet-cell">
                            <PawPrint size={16} />
                            {a.petName}
                          </div>
                        </td>
                        <td>{a.ownerName}</td>
                        <td>{a.dateTime}</td>
                        <td>
                          <span className="service-badge">
                            <Scissors size={14} />
                            {a.service}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${a.status.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="actions-btns">
                          <button
                            className="complete-btn"
                            disabled={a.status !== "Confirmed"}
                            onClick={() => completeAppointment(a.id)}
                            title="Complete appointment"
                          >
                            <Sparkles size={14} />
                            Complete
                          </button>
                          <button
                            className="cancel-btn"
                            disabled={a.status === "Completed" || a.status === "Cancelled"}
                            onClick={() => cancelAppointment(a.id)}
                            title="Cancel appointment"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}