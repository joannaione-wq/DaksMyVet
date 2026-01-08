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
} from "firebase/firestore";
import { LogOut, Plus, Stethoscope, Syringe, Scissors, Heart, Activity, Waves, X, User } from "lucide-react";
import "./ClientDashboard.css";

export default function ClientDashboard() {
  const navigate = useNavigate();

  // -----------------------------
  // STATES
  // -----------------------------
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
  ageYears: "",
  ageMonths: "",
  gender: "",
});


  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [showPetDetailsModal, setShowPetDetailsModal] = useState(false);
  const [selectedPetDetails, setSelectedPetDetails] = useState(null);


  const [gcashRef, setGcashRef] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFor, setPaymentFor] = useState(null);


  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]); // admin-defined slots

  const services = [
  {
    name: "Check-up",

    image: "https://i.pinimg.com/736x/85/94/62/859462af3f751a05012c674c68d86a1b.jpg",
    price: 100,
    description: "Comprehensive health examination for your pet."
  },
  {
    name: "Vaccinations",
    icon: Syringe,
    image: "https://tse3.mm.bing.net/th/id/OIP.pj-zvitdMFW_Q1pTtCSSgAHaE8?w=1000&h=667&rs=1&pid=ImgDetMain&o=7&rm=3",
    price: 100,
    description: "Essential vaccinations to protect your pet."
  },
  {
    name: "Grooming",
    icon: Scissors,
    image: "https://tse1.explicit.bing.net/th/id/OIP.HBXmnC4Kqy8i_nRjyIkpiAHaEc?rs=1&pid=ImgDetMain&o=7&rm=3",
    price: 100,
    description: "Full grooming service including bath and haircut."
  },
  {
    name: "Spay",
    icon: Heart,
    image: "https://www.veterinary-practice.com/wp-content/uploads/2018/06/treatment-scaled.jpeg",
    price: 100,
    description: "Spay procedure with post-operative care."
  },
  {
    name: "Neuter",
    icon: Activity,
    image: "https://tse3.mm.bing.net/th/id/OIP.dl8Dkf-QXlxlLKT9sqcKcQHaFH?w=2084&h=1441&rs=1&pid=ImgDetMain&o=7&rm=3",
    price: 100,
    description: "Neuter procedure with post-operative care."
  },
  {
    name: "Ultrasound",
    icon: Waves,
    image: "https://smb.ibsrv.net/imageresizer/image/article_manager/1200x1200/100063/308820/heroimage0.439007001627401746.jpg",
    price: 100,
    description: "Non-invasive diagnostic imaging."
  },
  {
    name: "Deworm",
    icon: Waves,
    image: "https://exoticpetquarters.com/wp-content/uploads/2023/04/%D0%BC%D0%B8%D0%BD-3.png",
    price: 100,
    description: "Deworming treatment."
  }
];

  const [serviceSlots, setServiceSlots] = useState({});

  // -----------------------------
  // FETCH FUNCTIONS
  // -----------------------------
  const fetchAppointments = async (uid) => {
    try {
      const q = query(collection(db, "appointments"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(list);

      const slotsByService = {};
      services.forEach((s) => {
        slotsByService[s.name] = list
          .filter((a) => a.service === s.name)
          .map((a) => a.dateTime);
      });
      setServiceSlots(slotsByService);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const fetchPets = async (uid) => {
    try {
      const q = query(collection(db, "pets"), where("ownerId", "==", uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort pets by next appointment
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
    } catch (err) {
      console.error("Error fetching pets:", err);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const snapshot = await getDocs(collection(db, "availableSlots"));
      const list = snapshot.docs.map((d) => d.data()); // {date, time}
      setAvailableSlots(list);
    } catch (err) {
      console.error("Error fetching available slots:", err);
    }
  };

  // -----------------------------
  // AUTH CHECK
  // -----------------------------
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

  // -----------------------------
  // PET HANDLERS
  // -----------------------------
  const handleAddOrEditPet = async (e) => {
    e.preventDefault();
    const { name, species, breed, ageYears, ageMonths, gender } = newPet;

if (
  !name ||
  !species ||
  !breed ||
  (ageYears === "" && ageMonths === "") ||
  !gender
) {
  return alert("Please complete all fields.");
}

    try {
      if (editingPet) {
        await updateDoc(doc(db, "pets", editingPet.id), newPet);
        setEditingPet(null);
      } else {
        await addDoc(collection(db, "pets"), { ownerId: user.uid, ...newPet });
      }

      setNewPet({ name: "", species: "", breed: "", ageYears: "", ageMonths: "", gender: "" });
      setShowPetModal(false);
      fetchPets(user.uid);
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
      fetchPets(user.uid);
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

  // -----------------------------
  // BOOKING FUNCTIONS
  // -----------------------------
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    // Generate next 8 weeks of dates
    for (let i = 0; i < 56; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
     const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD (local time)

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Check if date is Wednesday (day 3) OR has admin-added slots
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
    
    // Check if admin has defined slots for this date
    const adminSlots = availableSlots.filter(s => s.date === selectedDate);
    
    if (adminSlots.length > 0) {
      // Use admin-defined time slots
      return adminSlots.map(s => ({ value: s.time, label: s.time }));
    }
    
    // Default time slots for Wednesdays (if no admin slots defined)
    const defaultTimes = [
      "09:00 AM", "10:00 AM", "11:00 AM", 
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
    ];
    
    return defaultTimes.map(time => ({ value: time, label: time }));
  };

const isSlotBooked = (date, time) => {
  const dateTime = `${date} ${time}`;

  return appointments.some(
    (appt) =>
      appt.userId === user.uid &&
      appt.petName === selectedPet &&   // 👈 ONLY same pet
      appt.dateTime === dateTime &&
      appt.status !== "Cancelled"
  );
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
  if (!serviceSelected || !selectedPet || !selectedDate || !selectedTime) {
    return alert("Please select all fields");
  }

  const dateTime = `${selectedDate} ${selectedTime}`;

  // 🚫 BLOCK MULTI-SERVICE SAME TIME
  if (isSlotBooked(selectedDate, selectedTime)) {
    return alert(
      "You already have an appointment at this date and time. Please choose another time."
    );
  }

  try {
    const docRef = await addDoc(collection(db, "appointments"), {
      userId: user.uid,
      petName: selectedPet,
      service: serviceSelected,
      dateTime,
      status: "Pending Approval",
      createdAt: new Date(),
    });

    setPaymentFor({
      id: docRef.id,
      petName: selectedPet,
      service: serviceSelected,
      slot: dateTime,
      price: 100, // reservation fee
    });

    setShowServiceModal(false);
    setShowPaymentModal(true);

    await fetchAppointments(user.uid);
    setSelectedDate("");
    setSelectedTime("");
  } catch (err) {
    console.error(err);
    alert("Failed to book appointment.");
  }
};


  const handleCancel = async (appt) => {
    if (appt.status === "Confirmed" || appt.status === "Completed") return alert("Cannot cancel confirmed/completed");
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await deleteDoc(doc(db, "appointments", appt.id));
      fetchAppointments(user.uid);
      alert("Appointment canceled.");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel appointment.");
    }
  };

  const handleReschedule = async (id, currentSlot) => {
    const newSlot = prompt("Enter new slot (YYYY-MM-DD HH:mm):", currentSlot);
    if (!newSlot) return;
    try {
      await updateDoc(doc(db, "appointments", id), { dateTime: newSlot });
      fetchAppointments(user.uid);
      alert("Appointment rescheduled!");
    } catch (err) {
      console.error(err);
      alert("Failed to reschedule.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

 
  const handleConfirmPayment = async (method) => {
    try {
      // Create payment record with reservation status
      await addDoc(collection(db, "payments"), {
        appointmentId: paymentFor.id,
        userId: user.uid,
        petName: paymentFor.petName,
        service: paymentFor.service,
        amount: paymentFor.price,
        method,
        paymentType: "Reservation Payment",
        status: "Pending Admin Approval",
        createdAt: new Date(),
      });
      
      // Keep appointment status as "Pending Approval"
      setShowPaymentModal(false);
      setGcashRef("");
      fetchAppointments(user.uid);
      alert("Payment submitted! Your appointment is being processed. Please wait for confirmation.");
    } catch (err) {
      console.error(err);
      alert("Failed to confirm payment.");
    }
  };
  // -----------------------------
// GCASH PAYMENT HANDLER
// -----------------------------
const handleSubmitGcashPayment = async () => {
  if (!gcashRef.trim()) {
    return alert("Please enter your GCash reference number.");
  }

  try {
    // 1️⃣ Create payment record (ADMIN SEES THIS)
    await addDoc(collection(db, "payments"), {
      appointmentId: paymentFor.id,
      userId: user.uid,
      petName: paymentFor.petName,
      service: paymentFor.service,
      amount: paymentFor.price,
      method: "GCash",
      referenceNumber: gcashRef,
      paymentType: "Reservation Payment",
      status: "Pending Admin Approval",
      createdAt: new Date(),
    });

    // 2️⃣ Update appointment - only update status field
    await updateDoc(doc(db, "appointments", paymentFor.id), {
      status: "Pending Approval"
    });

    alert("Payment submitted! Please wait for confirmation.");

    setShowPaymentModal(false);
    setGcashRef("");
    setPaymentFor(null);

    await fetchAppointments(user.uid);
  } catch (err) {
    console.error("GCash error:", err);
    alert("Failed to submit payment. Error: " + err.message);
  }
};

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="client-dashboard">
      {/* Sidebar */}
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

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>


      {/* Main Content */}
      <div className="profile-content">
        {/* Appointments Section */}
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
                      <td><span className={`status-badge ${appt.status.toLowerCase().replace(' ', '-')}`}>{appt.status}</span></td>
                      <td>
                        <button
                          disabled={appt.status === "Completed"}
                          onClick={() => handleReschedule(appt.id, appt.dateTime)}
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

        {/* Pets Section */}
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
                      <p>
  <strong>Age:</strong>{" "}
  {p.ageYears || 0} year{p.ageYears != 1 ? "s" : ""}{" "}
  {p.ageMonths || 0} month{p.ageMonths != 1 ? "s" : ""}
</p>

                      <p><strong>Gender:</strong> {p.gender}</p>
                      <p className="pet-appointments-count">
                        {appointments.filter(a => a.petName === p.name).length} appointment(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services Section */}
        {activeTab === "services" && (
          <div className="services-section">
            <h3>Book a Service</h3>
            {pets.length === 0 ? (
              <p className="empty-message">Please add a pet before booking a service.</p>
            ) : (
              <>
                <h4>Select a Service:</h4>
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

    </div>
  ))}
</div>

              </>
            )}
          </div>
        )}
      </div>

 {/* SERVICE BOOKING MODAL */}
{showServiceModal && selectedService && (
  <div className="modal-overlay">
    <div className="modal-content service-booking-modal large-modal">
      <div className="modal-header">
        <div className="service-image">
          <img
            src={selectedService.image || "/placeholder-service.png"}
            alt={selectedService.name}
          />
        </div>
        <div className="service-header-info">
          <h3>{selectedService.name}</h3>
          <p className="service-modal-price">₱{selectedService.price}</p>
          <h5>Reservation Fee</h5>
        </div>
        <button className="close-btn" onClick={() => setShowServiceModal(false)}>
          <X size={24} />
        </button>
      </div>

      <div className="service-description">
        <h5>Service Description</h5>
        <p>{selectedService.description}</p>
      </div>

      <div className="booking-form-modal">
        <h5>Book This Service</h5>

        {/* Pet Selection */}
        <div className="form-group-modal">
          <label>Select Pet:</label>
          {pets.length > 1 ? (
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="modal-select"
            >
              <option value="">-- Choose your pet --</option>
              {pets.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
          ) : (
            <div className="selected-pet-box">
              <strong>{pets[0].name}</strong> ({pets[0].species})
            </div>
          )}
        </div>

        {/* Date & Time Selection */}
        <div className="form-group-modal">
          <label>Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime("");
            }}
            className="modal-select"
          >
            <option value="">-- Choose a date --</option>
            {generateDateOptions().map((date) => (
              <option
                key={date.value}
                value={date.value}
                disabled={date.disabled}
              >
                {date.label} {date.isAdminAdded ? "⭐" : ""}
              </option>
            ))}
          </select>
          <small className="helper-text">
           We operate every Wednesday. Please stay updated when our services are available in other days.
          </small>
        </div>

        {selectedDate && (
          <div className="form-group-modal">
            <label>Select Time:</label>
            <div className="time-slots-modal">
              {generateTimeOptions().map((time) => {
                const booked = isSlotBooked(selectedDate, time.value);
                return (
                  <button
                    key={time.value}
                    className={`time-slot-modal-btn ${
                      selectedTime === time.value ? "selected" : ""
                    } ${booked ? "booked" : ""}`}
                    onClick={() => !booked && setSelectedTime(time.value)}
                    disabled={booked}
                  >
                    {time.label}
                    {booked && <span className="booked-tag">Booked</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Booking Summary */}
        {selectedPet && selectedDate && selectedTime && (
          <div className="booking-summary-modal">
            <h5>📋 Reservation Summary</h5>
            <div className="summary-details">
              <div className="summary-row">
                <span>Pet:</span>
                <strong>{selectedPet}</strong>
              </div>
              <div className="summary-row">
                <span>Service:</span>
                <strong>{selectedService.name}</strong>
              </div>
              <div className="summary-row">
                <span>Date:</span>
                <strong>
                  {generateDateOptions().find((d) => d.value === selectedDate)
                    ?.label}
                </strong>
              </div>
              <div className="summary-row">
                <span>Time:</span>
                <strong>{selectedTime}</strong>
              </div>
              <div className="summary-row total-row">
                <span>Total Amount:</span>
                <strong className="total-price">₱{selectedService.price}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn-book-now"
            onClick={handleBookAppointment}
            disabled={!selectedPet || !selectedDate || !selectedTime}
          >
            Submit Reservation
          </button>
          <button
            className="btn-cancel-modal"
            onClick={() => setShowServiceModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* PET MODAL */}
{showPetModal && (
  <div className="modal-overlay">
    <div className="modal-content large-modal">
      <div className="modal-header">
        <div className="pet-image">

        </div>
        <h4>{editingPet ? "Edit Pet" : "Add Pet"}</h4>
        <button
          className="close-btn"
          onClick={() => {
            setShowPetModal(false);
            setEditingPet(null);
            setNewPet({ name: "", species: "", breed: "", ageYears: "", ageMonths: "", gender: "" });
          }}
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleAddOrEditPet} className="pet-form">
        <div className="form-row">
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

  <div className="age-selectors">
    <select
      value={newPet.ageYears}
      onChange={(e) => setNewPet({ ...newPet, ageYears: e.target.value })}
    >
      <option value="">Years</option>
      {[...Array(21).keys()].map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>

    <select
      value={newPet.ageMonths}
      onChange={(e) => setNewPet({ ...newPet, ageMonths: e.target.value })}
    >
      <option value="">Months</option>
      {[...Array(12).keys()].map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
</div>

        <div className="form-row">
          <select
            value={newPet.gender}
            onChange={(e) => setNewPet({ ...newPet, gender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="modal-buttons">
          <button type="submit">{editingPet ? "Save" : "Add"}</button>
          <button
            type="button"
            onClick={() => {
              setShowPetModal(false);
              setEditingPet(null);
              setNewPet({ name: "", species: "", breed: "", ageYears: "", ageMonths: "", gender: "" });
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content settings-modal">
            <div className="modal-header">
              <h4>Profile</h4>
              <button className="close-btn" onClick={() => setShowSettingsModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="settings-content">
              <div className="profile-section">
                <div className="profile-icon">
                  <User size={48} />
                </div>
                <h5>Profile Information</h5>
                <div className="profile-info">
                  <p><strong>Name:</strong> {user?.name || "Not set"}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>User ID:</strong> {user?.uid?.substring(0, 8)}...</p>
                  <p><strong>Total Pets:</strong> {pets.length}</p>
                  <p><strong>Total Appointments:</strong> {appointments.length}</p>
                </div>
              </div>

              <div className="settings-actions">
                <button className="logout-btn-modal" onClick={handleLogout}>
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PET DETAILS MODAL */}
      {showPetDetailsModal && selectedPetDetails && (
        <div className="modal-overlay">
          <div className="modal-content pet-details-modal">
            <div className="modal-header">
              <h4>{selectedPetDetails.name}'s Appointments</h4>
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
                      <td><span className={`status-badge ${appt.status.toLowerCase().replace(' ', '-')}`}>{appt.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT METHOD SELECTION MODAL */}
 {showPaymentModal && paymentFor && (
  <div className="modal-overlay">
    <div className="modal-content large-modal">
      <div className="modal-header">
        <h4>GCash Payment</h4>
        <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
          <X size={24} />
        </button>
      </div>

      <div className="payment-details">
        <p><strong>Service:</strong> {paymentFor.service}</p>
        <p><strong>Pet:</strong> {paymentFor.petName}</p>
        <p><strong>Schedule:</strong> {paymentFor.slot}</p>
        <p><strong>Amount:</strong> ₱{paymentFor.price}</p>
      </div>

      <div className="form-group-modal">
        <label>Enter GCash Reference Number:</label>
        <input
          type="text"
          value={gcashRef}
          onChange={(e) => setGcashRef(e.target.value)}
          placeholder="GCash Reference Number"
        />
      </div>

      <div className="modal-actions">
        <button
          className="btn-book-now"
          onClick={handleSubmitGcashPayment}
        >
          Submit Payment
        </button>
        <button
          className="btn-cancel-modal"
          onClick={() => setShowPaymentModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}