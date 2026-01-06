import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import AdminLoginPage from "./AdminLoginPage";

import ClientDashboard from "./ClientDashboard";
import BookAppointment from "./BookAppointment";
import ViewAppointments from "./ViewAppointments";
import MyPets from "./MyPets";

import VeterinarianDashboard from "./VeterinarianDashboard";
import VetAppointments from "./VetAppointments";
import VetPatients from "./VetPatients";
import VetProfile from "./VetProfile";

import GroomerDashboard from "./GroomerDashboard";
import AdminDashboard from "./AdminDashboard";

// -------------------------
// Protected Route Components
// -------------------------
function ProtectedRoute({ children, role, currentUserRole }) {
  if (currentUserRole === null) return <div>Loading...</div>;
  return currentUserRole === role ? children : <Navigate to="/login" replace />;
}

// -------------------------
// Main App Component
// -------------------------
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role?.toLowerCase().trim();
            setCurrentUserRole(role);
          } else {
            setCurrentUserRole(null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setCurrentUserRole(null);
        }
      } else {
        setCurrentUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Client Routes */}
        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute role="client" currentUserRole={currentUserRole}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-dashboard/book-appointment"
          element={
            <ProtectedRoute role="client" currentUserRole={currentUserRole}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-dashboard/view-appointments"
          element={
            <ProtectedRoute role="client" currentUserRole={currentUserRole}>
              <ViewAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-dashboard/my-pets"
          element={
            <ProtectedRoute role="client" currentUserRole={currentUserRole}>
              <MyPets />
            </ProtectedRoute>
          }
        />

        {/* Vet Routes */}
        <Route
          path="/vet-dashboard"
          element={
            <ProtectedRoute role="vet" currentUserRole={currentUserRole}>
              <VeterinarianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet-appointments"
          element={
            <ProtectedRoute role="vet" currentUserRole={currentUserRole}>
              <VetAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet-patients"
          element={
            <ProtectedRoute role="vet" currentUserRole={currentUserRole}>
              <VetPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet-profile"
          element={
            <ProtectedRoute role="vet" currentUserRole={currentUserRole}>
              <VetProfile />
            </ProtectedRoute>
          }
        />

        {/* Groomer Routes */}
        <Route
          path="/groomer-dashboard"
          element={
            <ProtectedRoute role="groomer" currentUserRole={currentUserRole}>
              <GroomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin" currentUserRole={currentUserRole}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
