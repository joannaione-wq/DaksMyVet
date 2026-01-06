import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Home, Lock } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "./SignUpPage.css";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactMethod: "email",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      email,
      phone,
      address,
      contactMethod,
      password,
      confirmPassword,
    } = formData;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: name.trim(),
      });

      // Create Firestore user profile
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        contactMethod,
        role: "client",
        createdAt: serverTimestamp(),
      });

      navigate("/client-dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">Dak’s My Vet</div>
        <ul className="nav-links">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/login">Login</NavLink></li>
          <li><NavLink to="/signup" className="active">Sign Up</NavLink></li>
        </ul>
      </nav>

      {/* SIGNUP FORM */}
      <div className="signup-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>

          {error && <p className="error">{error}</p>}

          {/* Full Name */}
          <label>Full Name</label>
          <div className="input-with-icon">
            <User className="icon" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <label>Email</label>
          <div className="input-with-icon">
            <Mail className="icon" />
            <input
              type="email"
              name="email"
              placeholder="@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <label>Phone Number</label>
          <div className="input-with-icon">
            <Phone className="icon" />
            <input
              type="tel"
              name="phone"
              placeholder="09XXXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address */}
          <label>Address</label>
          <div className="input-with-icon">
            <Home className="icon" />
            <input
              type="text"
              name="address"
              placeholder="Complete home address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>


          {/* Password */}
          <label>Password</label>
          <div className="input-with-icon">
            <Lock className="icon" />
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <label>Confirm Password</label>
          <div className="input-with-icon">
            <Lock className="icon" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>

          <p className="login-text">
            Already have an account?{" "}
            <NavLink to="/login">Login here</NavLink>
          </p>
        </form>
      </div>
    </div>
  );
}
