// src/ClientDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { LogOut, Plus, Stethoscope, Syringe, Scissors, Heart, Activity, Waves, X, User } from "lucide-react";
import "./ClientDashboard.css";

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [serviceSelected, setServiceSelected] = useState(null);
  const [selectedPet, setSelectedPet] = useState("");
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [newPet, setNewPet] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    gender: "",
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showPetDetailsModal, setShowPetDetailsModal] = useState(false);
  const [selectedPetDetails, setSelectedPetDetails] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFor, setPaymentFor] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showReferenceModal, setShowReferenceModal] = useState(false);

  const services = [
    {
      name: "Check-up",
      icon: Stethoscope,
      image: "https://i.pinimg.com/736x/85/94/62/859462af3f751a05012c674c68d86a1b.jpg",
      price: 500,
      description: "Comprehensive health examination for your pet."
    },
    {
      name: "Vaccinations",
      icon: Syringe,
      image: "https://tse3.mm.bing.net/th/id/OIP.pj-zvitdMFW_Q1pTtCSSgAHaE8?w=1000&h=667&rs=1&pid=ImgDetMain&o=7&rm=3",
      price: 800,
      description: "Essential vaccinations to protect your pet."
    },
    {
      name: "Grooming",
      icon: Scissors,
      image: "https://tse1.explicit.bing.net/th/id/OIP.HBXmnC4Kqy8i_nRjyIkpiAHaEc?rs=1&pid=ImgDetMain&o=7&rm=3",
      price: 700,
      description: "Full grooming service including bath and haircut."
    },
    {
      name: "Spay",
      icon: Heart,
      image: "https://www.veterinary-practice.com/wp-content/uploads/2018/06/treatment-scaled.jpeg",
      price: 2500,
      description: "Spay procedure with post-operative care."
    },
    {
      name: "Neuter",
      icon: Activity,
      image: "https://tse3.mm.bing.net/th/id/OIP.dl8Dkf-QXlxlLKT9sqcKcQHaFH?w=2084&h=1441&rs=1&pid=ImgDetMain&o=7&rm=3",
      price: 2000,
      description: "Neuter procedure with post-operative care."
    },
    {
      name: "Ultrasound",
      icon: Waves,
      image: "https://smb.ibsrv.net/imageresizer/image/article_manager/1200x1200/100063/308820/heroimage0.439007001627401746.jpg",
      price: 1500,
      description: "Non-invasive diagnostic imaging."
    },
    {
      name: "Deworm",
      icon: Waves,
      image: "https://exoticpetquarters.com/wp-content/uploads/2023/04/%D0%BC%D0%B8%D0%BD-3.png",
      price: 300,
      description: "Deworming treatment."
    }
  ];

  const [serviceSlots, setServiceSlots] = useState({});

  const fetchAppointments = async (uid) => {
    try {
      const q = query(collection(db, "appointments"), where("userId", "==", uid));
      onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAppointments(list);

        const slotsByService = {};
        services.forEach((s) => {
          slotsByService[s.name] = list
            .filter((a) => a.service === s.name)
            .map((a) => a.dateTime);
        });
        setServiceSlots(slotsByService);
      });
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const fetchPets = async (uid) => {
    try {
      const q = query(collection(db, "pets"), where("ownerId", "==", uid));
      onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const sortedPets = list.sort((a, b) => {
          const nextA = appointments
            .filter((ap) => ap.petName === a.name)
            .map((ap) => new Date(ap.dateTime))
            .sort((x, y) => x - y)[0];
          const nextB = appointments
            .filter((ap) => ap.petName === b.name)
            .map((ap) => new Date(ap.dateTime))
            .sort((x, y) => x - y)[0];
          if (!nextA) return 1;
          if (!nextB) return -1;
          return nextA - nextB;
        });
        setPets(sortedPets);
        if (list.length === 1) setSelectedPet(list[0].name);
      });
    } catch (err) {
      console.error("Error fetching pets:", err);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const snapshot = await getDocs(collection(db, "availableSlots"));
      const list = snapshot.docs.map((d) => d.data());
      setAvailableSlots(list);
    } catch (err) {
      console.error("Error fetching available slots:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) navigate("/login");
      else {
        try {
          const q = query(collection(db, "users"), where("user_id", "==", currentUser.uid));
          const snapshot = await getDocs(q);
          const userData = !snapshot.empty ? snapshot.docs[0].data() : {};
          setUser({ ...currentUser, name: userData.user_name || currentUser.email });

          await fetchAppointments(currentUser.uid);
          await fetchPets(currentUser.uid);
          await fetchAvailableSlots();
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUser(currentUser);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user?.uid) fetchPets(user.uid);
  }, [appointments, user]);

  const handleAddOrEditPet = async (e) => {
    e.preventDefault();
    const { name, species, breed, age, gender } = newPet;
    if (!name || !species || !breed || !age || !gender)
      return alert("Please complete all fields.");

    try {
      if (editingPet) {
        await updateDoc(doc(db, "pets", editingPet.id), newPet);
        setEditingPet(null);
      } else {
        await addDoc(collection(db, "pets"), { 
          ownerId: user.uid,
          ownerName: user.name,
          ownerEmail: user.email,
          medicalHistory: [],
          vaccinations: [],
          ...newPet 
        });
      }

      setNewPet({ name: "", species: "", breed: "", age: "", gender: "" });
      setShowPetModal(false);
      alert(editingPet ? "Pet updated!" : "Pet added!");
    } catch (err) {
      console.error("Error saving pet:", err);
      alert("Failed to save pet.");
    }
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet);
    setNewPet(pet);
    setShowPetModal(true);
  };

  const handleDeletePet = async (pet) => {
    if (!window.confirm("Are you sure you want to delete this pet?")) return;
    try {
      await deleteDoc(doc(db, "pets", pet.id));
      alert("Pet deleted!");
    } catch (err) {
      console.error("Error deleting pet:", err);
      alert("Failed to delete pet.");
    }
  };

  const handleViewPetDetails = (pet) => {
    const petAppointments = appointments.filter(appt => appt.petName === pet.name);
    setSelectedPetDetails({ ...pet, appointments: petAppointments });
    setShowPetDetailsModal(true);
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 56; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const isWednesday = date.getDay() === 3;
      const hasAdminSlot = availableSlots.some(s => s.date === dateStr);
      const isSelectable = isWednesday || hasAdminSlot;
      
      options.push({
        value: dateStr,
        label: `${dayName}, ${monthDay}`,
        disabled: !isSelectable,
        isAdminAdded: hasAdminSlot && !isWednesday
      });
    }
    
    return options;
  };

  const generateTimeOptions = () => {
    if (!selectedDate) return [];
    
    const adminSlots = availableSlots.filter(s => s.date === selectedDate);
    
    if (adminSlots.length > 0) {
      return adminSlots.map(s => ({ value: s.time, label: s.time }));
    }
    
    const defaultTimes = [
      "09:00 AM", "10:00 AM", "11:00 AM", 
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
    ];
    
    return defaultTimes.map(time => ({ value: time, label: time }));
  };

  const isSlotBooked = (date, time) => {
    if (!serviceSelected) return false;
    const dateTime = `${date} ${time}`;
    return (serviceSlots[serviceSelected] || []).includes(dateTime);
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setServiceSelected(service.name);
    setSelectedDate("");
    setSelectedTime("");
    if (pets.length === 1) setSelectedPet(pets[0].name);
    setShowServiceModal(true);
  };

  const handleBookAppointment = async () => {
    if (!serviceSelected || !selectedPet || !selectedDate || !selectedTime) 
      return alert("Please select all fields");

    const dateTime = `${selectedDate} ${selectedTime}`;

    if (isSlotBooked(selectedDate, selectedTime)) 
      return alert("Slot already booked.");

    try {
      const selectedPetData = pets.find(p => p.name === selectedPet);
      
      const docRef = await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        petName: selectedPet,
        petId: selectedPetData?.id || null,
        service: serviceSelected,
        dateTime,
        status: "Pending Payment",
        createdAt: new Date(),
        amount: selectedService?.price || 0,
      });

      setPaymentFor({
        id: docRef.id,
        petName: selectedPet,
        service: serviceSelected,
        slot: dateTime,
        price: selectedService?.price || 0,
      });
      
      setShowServiceModal(false);
      setShowPaymentModal(true);
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      console.error(err);
      alert("Failed to book appointment.");
    }
  };

  const handleCancel = async (appt) => {
    if (appt.status === "Confirmed" || appt.status === "Completed") 
      return alert("Cannot cancel confirmed/completed appointments");
    if (!window.confirm("Cancel this appointment?")) return;
    
    try {
      await deleteDoc(doc(db, "appointments", appt.id));
      
      // Delete associated payment if exists
      const paymentQuery = query(
        collection(db, "payments"), 
        where("appointmentId", "==", appt.id)
      );
      const paymentSnap = await getDocs(paymentQuery);
      paymentSnap.forEach(async (paymentDoc) => {
        await deleteDoc(doc(db, "payments", paymentDoc.id));
      });
      
      alert("Appointment canceled.");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel appointment.");
    }
  };

  const handleReschedule = async (appt) => {
    if (appt.status === "Confirmed" || appt.status === "Completed") 
      return alert("Cannot reschedule confirmed/completed appointments");
    
    // Show service modal with current appointment data
    setSelectedService(services.find(s => s.name === appt.service));
    setServiceSelected(appt.service);
    setSelectedPet(appt.petName);
    setShowServiceModal(true);
    
    // Delete old appointment
    await deleteDoc(doc(db, "appointments", appt.id));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSubmitReference = async () => {
    if (!referenceNumber.trim()) {
      return alert("Please enter a reference number");
    }

    try {
      await addDoc(collection(db, "payments"), {
        appointmentId: paymentFor.id,
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        petName: paymentFor.petName,
        service: paymentFor.service,
        amount: paymentFor.price,
        method: "GCash",
        referenceNumber: referenceNumber,
        paymentType: "Reservation Payment",
        status: "Pending Approval",
        createdAt: new Date(),
      });
      
      await updateDoc(doc(db, "appointments", paymentFor.id), {
        status: "Pending Approval",
        paymentStatus: "Pending Approval"
      });
      
      setShowReferenceModal(false);
      setShowPaymentModal(false);
      setReferenceNumber("");
      
      alert("Payment submitted! Your reservation is being processed. Please wait for admin confirmation.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment.");
    }
  };

return (
  <div className="client-dashboard">
    {/* SIDEBAR */}
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Dak's My Vet</h2>
      </div>

      <div className="sidebar-tabs">
        <button
          className={activeTab === "appointments" ? "active" : ""}
          onClick={() => setActiveTab("appointments")}
        >
          Appointments
        </button>
        <button
          className={activeTab === "pets" ? "active" : ""}
          onClick={() => setActiveTab("pets")}
        >
          Pets
        </button>
        <button
          className={activeTab === "services" ? "active" : ""}
          onClick={() => setActiveTab("services")}
        >
          Services
        </button>
      </div>

      <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>
        Profile
      </button>

      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </div>

    {/* MAIN CONTENT */}
    <div className="profile-content">
      {/* APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="appointments-section">
          <h3>My Appointments</h3>
          {appointments.length === 0 ? (
            <p className="empty-message">No appointments scheduled.</p>
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
                    <td>
                      <span className={`status-badge ${appt.status.toLowerCase().replace(' ', '-')}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      <button
                        disabled={appt.status === "Completed" || appt.status === "Confirmed"}
                        onClick={() => handleReschedule(appt)}
                      >
                        Reschedule
                      </button>
                      <button onClick={() => handleCancel(appt)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PETS TAB */}
      {activeTab === "pets" && (
        <div className="pets-section">
          <h3>
            My Pets
            <button className="add-pet-btn" onClick={() => setShowPetModal(true)}>
              <Plus size={16} />
            </button>
          </h3>
          {pets.length === 0 ? (
            <p className="empty-message">No pets added yet.</p>
          ) : (
            <div className="pets-grid">
              {pets.map((p) => (
                <div key={p.id} className="pet-card" onClick={() => handleViewPetDetails(p)}>
                  <div className="pet-card-header">
                    <h4>{p.name}</h4>
                    <span className="pet-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEditPet(p)}>Edit</button>
                      <button onClick={() => handleDeletePet(p)}>Delete</button>
                    </span>
                  </div>
                  <div className="pet-card-body">
                    <p><strong>Species:</strong> {p.species}</p>
                    <p><strong>Breed:</strong> {p.breed}</p>
                    <p><strong>Age:</strong> {p.age} years</p>
                    <p><strong>Gender:</strong> {p.gender}</p>
                    <p className="pet-appointments-count">
                      {appointments.filter(a => a.petName === p.name).length} appointment(s)
                    </p>

                    {p.medicalHistory && p.medicalHistory.length > 0 && (
                      <div className="medical-preview">
                        <strong>Recent Notes:</strong>
                        <p>{p.medicalHistory[p.medicalHistory.length - 1].note}</p>
                      </div>
                    )}

                    {p.vaccinations && p.vaccinations.length > 0 && (
                      <div className="vaccination-preview">
                        <strong>Recent Vaccination:</strong>
                        <p>{p.vaccinations[p.vaccinations.length - 1].vaccine}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <div className="services-section">
          <h3>Book a Service</h3>
          {pets.length === 0 ? (
            <p className="empty-message">Please add a pet before booking a service.</p>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="service-card"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="service-card-image">
                    <img
                      src={service.image || "/placeholder-service.png"}
                      alt={service.name}
                      className="service-photo-square"
                    />
                  </div>
                  <h4>{service.name}</h4>
                  <p className="service-price">₱{service.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {/* MODALS */}
    {/* PET MODAL */}
    {showPetModal && (
      <div className="modal-overlay">
        <div className="modal-content large-modal">
          <div className="modal-header">
            <h4>{editingPet ? "Edit Pet" : "Add Pet"}</h4>
            <button className="close-btn" onClick={() => {
              setShowPetModal(false);
              setEditingPet(null);
              setNewPet({ name: "", species: "", breed: "", age: "", gender: "" });
            }}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleAddOrEditPet} className="pet-form">
            <div className="form-row">
              <input type="text" placeholder="Name" value={newPet.name}
                onChange={(e) => setNewPet({ ...newPet, name: e.target.value })} />
              <input type="text" placeholder="Species" value={newPet.species}
                onChange={(e) => setNewPet({ ...newPet, species: e.target.value })} />
            </div>
            <div className="form-row">
              <input type="text" placeholder="Breed" value={newPet.breed}
                onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })} />
              <input type="number" placeholder="Age" value={newPet.age}
                onChange={(e) => setNewPet({ ...newPet, age: e.target.value })} />
            </div>
            <div className="form-row">
              <select value={newPet.gender} onChange={(e) => setNewPet({ ...newPet, gender: e.target.value })}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="modal-buttons">
              <button type="submit">{editingPet ? "Save" : "Add"}</button>
              <button type="button" onClick={() => {
                setShowPetModal(false);
                setEditingPet(null);
                setNewPet({ name: "", species: "", breed: "", age: "", gender: "" });
              }}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* PET DETAILS MODAL */}
    {showPetDetailsModal && selectedPetDetails && (
      <div className="modal-overlay">
        <div className="modal-content pet-details-modal">
          <div className="modal-header">
            <h4>{selectedPetDetails.name}'s Records</h4>
            <button className="close-btn" onClick={() => setShowPetDetailsModal(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="pet-info">
            <p><strong>Species:</strong> {selectedPetDetails.species}</p>
            <p><strong>Breed:</strong> {selectedPetDetails.breed}</p>
            <p><strong>Age:</strong> {selectedPetDetails.age} years</p>
            <p><strong>Gender:</strong> {selectedPetDetails.gender}</p>
          </div>

          <hr />
          <h5>Medical Notes</h5>
          {selectedPetDetails.medicalHistory && selectedPetDetails.medicalHistory.length > 0 ? (
            <div className="medical-history-list">
              {selectedPetDetails.medicalHistory.map((record, idx) => (
                <div key={idx} className="medical-record-item">
                  <p><strong>{new Date(record.date).toLocaleDateString()}</strong></p>
                  <p>{record.note}</p>
                </div>
              ))}
            </div>
          ) : <p className="empty-message">No medical notes yet.</p>}

          <hr />
          <h5>Vaccinations</h5>
          {selectedPetDetails.vaccinations && selectedPetDetails.vaccinations.length > 0 ? (
            <div className="vaccination-list">
              {selectedPetDetails.vaccinations.map((vac, idx) => (
                <div key={idx} className="vaccination-item">
                  <p><strong>{vac.vaccine}</strong> - {new Date(vac.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : <p className="empty-message">No vaccinations recorded yet.</p>}

          <hr />
          <h5>Appointment History</h5>
          {selectedPetDetails.appointments.length === 0 ? (
            <p className="empty-message">No appointments yet.</p>
          ) : (
            <table className="pet-appointments-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedPetDetails.appointments
                  .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
                  .map((appt) => (
                  <tr key={appt.id}>
                    <td>{appt.service}</td>
                    <td>{appt.dateTime}</td>
                    <td>
                      <span className={`status-badge ${appt.status.toLowerCase().replace(' ', '-')}`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )}

    {/* SERVICE BOOKING MODAL */}
    {showServiceModal && selectedService && (
      <div className="modal-overlay">
        <div className="modal-content service-booking-modal large-modal">
          {/* ...service booking modal content... */}
        </div>
      </div>
    )}

    {/* PAYMENT MODAL */}
    {showPaymentModal && paymentFor && (
      <div className="modal-overlay">
        <div className="modal-content payment-modal">
          {/* ...payment modal content... */}
        </div>
      </div>
    )}
  </div>
)}
