import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import "./LoginPage.css";

function LoginPage() {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch Firestore document to check role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User data not found in Firestore");
      }

      const role = userDoc.data().role?.toLowerCase().trim();

      // Redirect based on role
      if (role === "client") {
        navigate("/client-dashboard");
      } else if (role === "vet") {
        navigate("/vet-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
        } else if (role === "groomer") {
        navigate("/groomer-dashboard");
      } else {
        throw new Error("Unknown user role");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Provide user-friendly error messages
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="logo">Dak's My Vet</div>
        <ul className="nav-links">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/login" className="login-btn active">Login</NavLink></li>
          <li><NavLink to="/signup" className="login-btn">Sign Up</NavLink></li>
        </ul>
      </nav>

      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>
          {error && <p className="error">{error}</p>}

          <label>Email</label>
          <div className="input-with-icon">
            <Mail className="icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
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

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="signup-text">
            Don't have an account? <NavLink to="/signup" className="signup-link">Sign Up</NavLink>
          </p>
          
          <p className="forgot-password-text">
            <NavLink to="/forgot-password" className="forgot-password-link">Forgot Password?</NavLink>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;