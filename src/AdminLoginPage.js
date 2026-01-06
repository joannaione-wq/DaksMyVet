import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import "./SignUpPage.css"; // reuse same CSS

function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = formData.email.trim();
    const password = formData.password.trim();

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth user:", user);

      // Read Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User data not found in Firestore");
      }

      const role = userDoc.data().role?.toLowerCase().trim();
      if (role !== "admin") {
        throw new Error("Not authorized as admin");
      }

      // Admin login successful
      navigate("/admin-dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <nav className="navbar">
        <div className="logo">Dak’s My Vet</div>
        <ul className="nav-links">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/admin-login" className="login-btn active">Admin Login</NavLink></li>
        </ul>
      </nav>

      <div className="signup-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Admin Login</h2>
          {error && <p className="error">{error}</p>}

          <label>Email</label>
          <div className="input-with-icon">
            <Mail className="icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your admin email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label>Password</label>
          <div className="input-with-icon">
            <Lock className="icon" />
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="signup-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
