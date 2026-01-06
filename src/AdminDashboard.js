// src/AdminDashboard.js
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db, functions } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  User,
  LogOut,
  PawPrint,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [newUser, setNewUser] = useState({ email: "", name: "", role: "client" });
  const [newSchedule, setNewSchedule] = useState({ date: "", time: "" });
  const [message, setMessage] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const [viewPetsUser, setViewPetsUser] = useState(null);
  const [viewPetsModal, setViewPetsModal] = useState(false);

  // -----------------------------
  // Helper: default next Wednesday
  // -----------------------------
  const getNextWednesday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (3 + 7 - day) % 7 || 7; // Wednesday = 3
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + diff);
    return nextWed.toISOString().split("T")[0]; // yyyy-mm-dd
  };

  // -----------------------------
  // Fetch all data
  // -----------------------------
  const fetchAllData = useCallback(async () => {
    try {
      const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const petsSnap = await getDocs(query(collection(db, "pets"), orderBy("createdAt", "desc")));
      setPets(petsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const apptSnap = await getDocs(query(collection(db, "appointments"), orderBy("dateTime", "desc")));
      const appts = apptSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(appts);

      const paymentsData = appts.map((a) => ({
        id: a.id,
        userId: a.userId,
        amount: a.paymentAmount || 100,
        status: a.paymentStatus || "unpaid",
        date: a.dateTime,
      }));
      setPayments(paymentsData);

      const scheduleSnap = await getDocs(query(collection(db, "schedules"), orderBy("date")));
      setSchedules(scheduleSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Default newSchedule date to next Wednesday
      setNewSchedule({ date: getNextWednesday(), time: "" });
    } catch (err) {
      showMessage(err.message, true);
    }
  }, []);

  // -----------------------------
  // Auth Check
  // -----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/login");
      const q = query(collection(db, "users"), where("email", "==", u.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) setCurrentUserData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      fetchAllData();
    });
    return () => unsubscribe();
  }, [navigate, fetchAllData]);

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // -----------------------------
  // Create User
  // -----------------------------
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const createUserFn = httpsCallable(functions, "createNewUser");
      await createUserFn(newUser);
      setNewUser({ email: "", name: "", role: "client" });
      fetchAllData();
      showMessage("User created successfully!");
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  // -----------------------------
  // Edit User
  // -----------------------------
  const openEditModal = (user) => {
    setEditUser({ ...user });
    setModalOpen(true);
  };
  const closeEditModal = () => {
    setModalOpen(false);
    setEditUser(null);
  };
  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      const userRef = doc(db, "users", editUser.id);
      await updateDoc(userRef, { name: editUser.name, role: editUser.role });
      fetchAllData();
      closeEditModal();
      showMessage("User updated successfully!");
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  // -----------------------------
  // Delete User
  // -----------------------------
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const deleteUserFn = httpsCallable(functions, "deleteUser");
      await deleteUserFn({ uid: id });
      fetchAllData();
      showMessage("User deleted!");
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  // -----------------------------
  // Reset Password
  // -----------------------------
  const handleResetPassword = async (email) => {
    try {
      const resetFn = httpsCallable(functions, "resetUserPassword");
      await resetFn({ email });
      showMessage("Password reset email sent!");
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  // -----------------------------
  // View Pets Modal
  // -----------------------------
  const openViewPetsModal = (user) => {
    setViewPetsUser(user);
    setViewPetsModal(true);
  };
  const closeViewPetsModal = () => {
    setViewPetsUser(null);
    setViewPetsModal(false);
  };

  // -----------------------------
  // Add Schedule
  // -----------------------------
  const openScheduleModal = () => {
    setScheduleModalOpen(true);
  };
  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    setNewSchedule({ date: getNextWednesday(), time: "" });
  };
  const handleAddSchedule = async () => {
    if (!newSchedule.date || !newSchedule.time) return showMessage("Date and time required", true);
    try {
      await addDoc(collection(db, "schedules"), {
        date: newSchedule.date,
        time: newSchedule.time,
        isBooked: false,
        clientId: null,
      });
      fetchAllData();
      closeScheduleModal();
      showMessage("Schedule added!");
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  // -----------------------------
  // Mark payment as paid
  // -----------------------------
  const markAsPaid = async (payment) => {
    try {
      const apptRef = doc(db, "appointments", payment.id);
      await updateDoc(apptRef, { paymentStatus: "paid" });
      fetchAllData();
      showMessage("Payment marked as paid!");
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const filteredPayments = payments.filter(p => paymentFilter === "all" || p.status === paymentFilter);

  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="client-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="user-info">
          <PawPrint size={40} />
          <div>
            <h3>{currentUserData?.name || "Admin"}</h3>
            <p>{currentUserData?.role || "Administrator"}</p>
          </div>
        </div>
        <div className="sidebar-tabs">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>Users</button>
          <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>Appointments</button>
          <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>Payments</button>
          <button className={activeTab === "schedules" ? "active" : ""} onClick={() => setActiveTab("schedules")}>Schedules</button>
        </div>
        <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /> Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {message && <div className="message">{message}</div>}

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="overview-cards">
            <div className="card"><User size={40} /><h4>Users</h4><p>{users.length}</p></div>
            <div className="card"><PawPrint size={40} /><h4>Pets</h4><p>{pets.length}</p></div>
            <div className="card"><CalendarDays size={40} /><h4>Appointments</h4><p>{appointments.length}</p></div>
            <div className="card"><CreditCard size={40} /><h4>Payments</h4><p>{payments.length}</p></div>
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className="table-section">
            <form className="create-user-form" onSubmit={handleCreateUser}>
              <input type="text" placeholder="Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
  <option value="client">Client</option>
  <option value="vet">Vet</option>
  <option value="groomer">Groomer</option>

</select>

              <button type="submit">Create User</button>
            </form>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <button className="edit-btn" onClick={() => openEditModal(u)}>Edit</button>
                      <button className="reset-btn" onClick={() => handleResetPassword(u.email)}>Reset</button>
                      <button className="delete-btn" onClick={() => handleDeleteUser(u.id)}>Delete</button>
                      {u.role === "client" && <button className="view-pets-btn" onClick={() => openViewPetsModal(u)}>View Pets</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Appointments */}
        {activeTab === "appointments" && (
          <div className="table-section">
            <table>
              <thead><tr><th>Pet</th><th>Service</th><th>Date & Time</th><th>Status</th><th>Client</th></tr></thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td>{a.petName}</td>
                    <td>{a.service}</td>
                    <td>{a.dateTime}</td>
                    <td>{a.status}</td>
                    <td>{users.find(u => u.id === a.userId)?.name || "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments */}
        {activeTab === "payments" && (
          <div className="table-section">
            <div className="payment-bar">
              <button className={paymentFilter === "all" ? "active" : ""} onClick={() => setPaymentFilter("all")}>All</button>
              <button className={paymentFilter === "paid" ? "active" : ""} onClick={() => setPaymentFilter("paid")}>Paid</button>
              <button className={paymentFilter === "unpaid" ? "active" : ""} onClick={() => setPaymentFilter("unpaid")}>Unpaid</button>
            </div>
            <table>
              <thead><tr><th>Client</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan="5" className="empty-message">No payments found</td></tr>
                ) : filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td>{users.find(u => u.id === p.userId)?.name || "Unknown"}</td>
                    <td>₱{p.amount}</td>
                    <td>{p.date}</td>
                    <td>{p.status === "paid" ? <span className="paid-label">Paid</span> : "Unpaid"}</td>
                    <td>{p.status === "unpaid" && <button className="pay-btn" onClick={() => markAsPaid(p)}>Mark as Paid</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Schedules */}
        {activeTab === "schedules" && (
          <div className="table-section">
            <button onClick={openScheduleModal} className="add-pet-btn">Add Schedule</button>
            <table>
              <thead><tr><th>Date</th><th>Time</th><th>Booked</th><th>Client</th></tr></thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr><td colSpan="4" className="empty-message">No schedules found</td></tr>
                ) : schedules.map(s => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td>{s.time}</td>
                    <td>{s.isBooked ? "Yes" : "No"}</td>
                    <td>{s.clientId ? users.find(u => u.id === s.clientId)?.name : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {modalOpen && editUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit User</h3>
            <input type="text" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
            <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
              <option value="client">Client</option>
              <option value="vet">Vet</option>
              <option value="groomer">Groomer</option>
            </select>
            <div className="modal-buttons">
              <button className="edit-btn" onClick={handleSaveEdit}>Save</button>
              <button className="delete-btn" onClick={() => { handleDeleteUser(editUser.id); closeEditModal(); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Pets Modal */}
      {viewPetsModal && viewPetsUser && (
        <div className="modal-overlay" onClick={closeViewPetsModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{viewPetsUser.name}'s Pets</h3>
            <table>
              <thead><tr><th>Name</th><th>Species</th><th>Breed</th><th>Age</th></tr></thead>
              <tbody>
                {pets.filter(p => p.ownerId === viewPetsUser.id).length === 0 ? (
                  <tr><td colSpan="4" className="empty-message">No pets found</td></tr>
                ) : pets.filter(p => p.ownerId === viewPetsUser.id).map(p => (
                  <tr key={p.id}><td>{p.name}</td><td>{p.species}</td><td>{p.breed}</td><td>{p.age}</td></tr>
                ))}
              </tbody>
            </table>
            <button className="edit-btn" onClick={closeViewPetsModal}>Close</button>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {scheduleModalOpen && (
        <div className="modal-overlay" onClick={closeScheduleModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Schedule</h3>
            <input type="date" value={newSchedule.date} onChange={e => setNewSchedule({ ...newSchedule, date: e.target.value })} />
            <input type="time" value={newSchedule.time} onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })} />
            <div className="modal-buttons">
              <button className="add-pet-btn" onClick={handleAddSchedule}>Add</button>
              <button className="delete-btn" onClick={closeScheduleModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

