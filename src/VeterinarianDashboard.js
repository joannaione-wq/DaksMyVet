// src/VeterinarianDashboard.js
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
  ClipboardList,
  Syringe
} from "lucide-react";
import "./VeterinarianDashboard.css";

export default function VeterinarianDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editVaccine, setEditVaccine] = useState("");
const [editProfileName, setEditProfileName] = useState("");
const [editProfileEmail, setEditProfileEmail] = useState("");
const [editProfilePhoto, setEditProfilePhoto] = useState("");
const vaccineOptions = [
  "Rabies",
  "Distemper",
  "Parvovirus",
  "Hepatitis",
  "Leptospirosis",
  "Parainfluenza",
  "Bordetella",
  "Lyme",
];

useEffect(() => {
  if (user) {
    setEditProfileName(user.displayName || "");
    setEditProfileEmail(user.email || "");
    setEditProfilePhoto(user.photoURL || "");
  }
}, [user]);

const saveProfile = async () => {
  if (!user) return;
  try {
    // Update Firebase Auth
    await auth.currentUser.updateProfile({
      displayName: editProfileName,
      photoURL: editProfilePhoto
    });
    // Update email if changed
    if (editProfileEmail !== user.email) {
      await auth.currentUser.updateEmail(editProfileEmail);
    }
    setUser(auth.currentUser);
    setModalOpen(false);
    alert("Profile updated!");
  } catch (error) {
    console.error(error);
    alert("Failed to update profile: " + error.message);
  }
};

// -------------------- PRINT ALL MEDICAL RECORDS --------------------
const printAllMedicalRecords = () => {
  if (!patients || patients.length === 0) {
    alert("No patient records available.");
    return;
  }

  const newWindow = window.open("", "_blank");
  if (!newWindow) return;

  const allRecords = patients.map((pet) => {
    const medicalNotes = (pet.medicalHistory || [])
      .map(
        (n) =>
          `<li>${n.note} <span style="color:#888;">(${new Date(
            n.date
          ).toLocaleDateString()})</span></li>`
      )
      .join("");

    const vaccinations = (pet.vaccinations || [])
      .map(
        (v) =>
          `<li>${v.vaccine} <span style="color:#888;">(${new Date(
            v.date
          ).toLocaleDateString()})</span></li>`
      )
      .join("");

    return `
      <div style="margin-bottom:40px;">
        <h2>${pet.name} (${pet.species})</h2>
        <h3>Medical Notes</h3>
        <ul>${medicalNotes || "<li>No medical notes</li>"}</ul>
        <h3>Vaccinations</h3>
        <ul>${vaccinations || "<li>No vaccinations</li>"}</ul>
      </div>
      <hr />
    `;
  }).join("");

  newWindow.document.write(`
    <html>
      <head>
        <title>All Patients Medical Records</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #ff6f91; margin-bottom: 5px; }
          h3 { margin-top: 10px; }
          ul { list-style: disc; padding-left: 20px; }
          hr { border: 1px dashed #ccc; margin: 30px 0; }
          button { display:none; } /* hide buttons when printing */
        </style>
      </head>
      <body>
        <h1>All Patients Medical Records</h1>
        ${allRecords}
        <script>
          window.print();
        </script>
      </body>
    </html>
  `);

  newWindow.document.close();
};


  // -------------------- AUTH --------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) navigate("/login");
      else {
        setUser(u);
        await fetchAppointments();
        await fetchPatients();
      }
    });
    return () => unsub();
  }, [navigate]);

  // -------------------- FETCH --------------------
  const fetchAppointments = async () => {
    setLoading(true);
    const q = query(collection(db, "appointments"), orderBy("dateTime", "asc"));
    const snap = await getDocs(q);
    setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const fetchPatients = async () => {
    const snap = await getDocs(collection(db, "pets"));
    setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // -------------------- APPOINTMENT ACTIONS --------------------
  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "appointments", id), { status });
    fetchAppointments();
  };

  const reschedule = async (id, currentSlot) => {
    const newDate = prompt(
      "Enter new Date & Time (YYYY-MM-DD HH:mm)",
      currentSlot
    );
    if (!newDate) return;
    await updateDoc(doc(db, "appointments", id), { dateTime: newDate });
    fetchAppointments();
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm("Cancel appointment?")) return;
    await updateDoc(doc(db, "appointments", id), { status: "Cancelled" });
    fetchAppointments();
  };

  // -------------------- MEDICAL RECORDS --------------------
  const openModal = (pet) => {
    setSelectedPet(pet);
    setEditNote("");
    setEditVaccine("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPet(null);
  };

  const saveNote = async () => {
    if (!editNote) return;
    await updateDoc(doc(db, "pets", selectedPet.id), {
      medicalHistory: [
        ...(selectedPet.medicalHistory || []),
        { note: editNote, date: new Date().toISOString() }
      ]
    });
    await fetchPatients();
    closeModal();
  };

  const saveVaccine = async () => {
    if (!editVaccine) return;
    await updateDoc(doc(db, "pets", selectedPet.id), {
      vaccinations: [
        ...(selectedPet.vaccinations || []),
        { vaccine: editVaccine, date: new Date().toISOString() }
      ]
    });
    await fetchPatients();
    closeModal();
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // -------------------- RENDER --------------------
  return (
    <div className="vet-dashboard">
    <aside className="sidebar">
  <div className="logo">
    <PawPrint size={28} /> Dak's My Vet
  </div>

  {/* Profile Section */}
  {user && (
    <div className="vet-profile">
      <img
        src="https://i.pinimg.com/1200x/b6/96/e5/b696e5282fa38114b7e028f4c646b947.jpg" 
        alt="Vet Profile"
        className="profile-pic"
      />
      <div className="profile-info">
        <h4>{user.displayName || "Veterinarian"}</h4>
        <p>{user.name}</p>
      </div>
      
    </div>
  )}

  {/* Tabs */}
  <button
    className={activeTab === "dashboard" ? "active" : ""}
    onClick={() => setActiveTab("dashboard")}
  >
    Dashboard
  </button>
  <button
    className={activeTab === "appointments" ? "active" : ""}
    onClick={() => setActiveTab("appointments")}
  >
    Appointments
  </button>
  <button
    className={activeTab === "patients" ? "active" : ""}
    onClick={() => setActiveTab("patients")}
  >
    Patients
  </button>
  <button
    className={activeTab === "records" ? "active" : ""}
    onClick={() => setActiveTab("records")}
  >
  Records
  </button>

  {/* Logout */}
  <button className="logout-btn" onClick={logout}>
    <LogOut size={16}/> Logout
  </button>
</aside>

<button className="print-btn" onClick={printAllMedicalRecords}>
  🖨 Print All Records
</button>


      {/* Main */}
      <main className="main">
        {activeTab === "dashboard" && (
          <section>
            <h2>Welcome, Doctor</h2>
            <div className="stats">
              <div className="stat-card">
                <h4>Total Appointments</h4>
                <p>{appointments.length}</p>
              </div>
              <div className="stat-card">
                <h4>Pending</h4>
                <p>{appointments.filter(a => a.status === "Pending").length}</p>
              </div>
              <div className="stat-card">
                <h4>Completed</h4>
                <p>{appointments.filter(a => a.status === "Completed").length}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "appointments" && (
          <section>
            <h2>Appointments</h2>
            {loading ? <p>Loading...</p> : (
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
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>{a.petName}</td>
                      <td>{a.service}</td>
                      <td>{a.dateTime}</td>
                      <td>{a.status}</td>
                      <td className="actions-btns">
                        <button
                          disabled={a.status !== "Pending"}
                          onClick={() => updateStatus(a.id, "Confirmed")}
                        >
                          Confirm
                        </button>
                        <button
                          disabled={a.status !== "Confirmed"}
                          onClick={() => updateStatus(a.id, "Completed")}
                        >
                          Complete
                        </button>
                        <button
                          disabled={a.status === "Completed"}
                          onClick={() => reschedule(a.id, a.dateTime)}
                        >
                          Reschedule
                        </button>
                        <button
                          disabled={a.status === "Completed"}
                          onClick={() => cancelAppointment(a.id)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {activeTab === "patients" && (
          <section>
            <h2>Patients</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Breed</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.species}</td>
                    <td>{p.breed}</td>
                    <td>{p.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === "records" && (
          <section>
            <h2>Medical Records</h2>
            <table>
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Species</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.species}</td>
                    <td>
                      <button onClick={() => openModal(p)}>
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {/* Profile Modal */}
{modalOpen === "profile" && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Edit Profile</h3>
      <input
        type="text"
        placeholder="Full Name"
        value={editProfileName}
        onChange={e => setEditProfileName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={editProfileEmail}
        onChange={e => setEditProfileEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Photo URL"
        value={editProfilePhoto}
        onChange={e => setEditProfilePhoto(e.target.value)}
      />

      <div className="modal-buttons">
        <button onClick={saveProfile}>Save</button>
        <button onClick={() => setModalOpen(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}


        {/* MODAL */}
        {modalOpen && selectedPet && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{selectedPet.name} Medical Records</h3>

              <h4>Medical Notes</h4>
              <ul>
                {(selectedPet.medicalHistory || []).map((n, i) => (
                  <li key={i}>{n.note}</li>
                ))}
              </ul>
              <input
                placeholder="Add new note"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
              />
              <button onClick={saveNote}>
                <ClipboardList size={16}/> Save Note
              </button>

              <h4>Vaccinations</h4>
              <ul>
                {(selectedPet.vaccinations || []).map((v, i) => (
                  <li key={i}>{v.vaccine}</li>
                ))}
              </ul>
              <input
                placeholder="Add new vaccine"
                value={editVaccine}
                onChange={e => setEditVaccine(e.target.value)}
              />
              <button onClick={saveVaccine}>
                <Syringe size={16}/> Save Vaccine
              </button>

              <button className="close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
