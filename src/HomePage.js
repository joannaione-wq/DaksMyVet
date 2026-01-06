import React from "react";
import { NavLink } from "react-router-dom";
import { LogIn, UserPlus, User } from "lucide-react"; // human icon for admin
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="homepage-container">
      <nav>
        <div className="logo">DAK’S MY VET</div>
        <ul className="nav-links">
          <li><NavLink to="/">Home</NavLink></li>

          {/* Login & Sign Up */}
          <li>
            <NavLink to="/login">
              <LogIn /> Log in
            </NavLink>
          </li>
          <li>
            <NavLink to="/signup">
              <UserPlus /> Sign Up
            </NavLink>
          </li>

          {/* Admin login using human icon */}
          <li>
            <NavLink to="/admin-login" title="Admin Login">
              <User />
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>Compassionate Care for Every Paw</h1>
          <p>
            Providing gentle, professional care to keep your pets healthy,
            happy, and loved—every step of the way.
          </p>
        </div>
        <div
          className="hero-image"
          style={{
            background: "url('https://i.pinimg.com/736x/f4/46/1b/f4461bb159cb03792764281e5b5992d6.jpg') center/cover no-repeat",
            borderRadius: "20px",
            width: "400px",
            height: "300px",
            margin: "1rem",
          }}
        ></div>
      </section>

      {/* CONTACT */}
      <section className="contact">
        <p>Email: daksmyvet@gmail.com</p>
        <p>Contact: 0907 179 0576</p>
        <p>Address: Montilla Street, Isabela, Philippines</p>
      </section>
    </div>
  );
}
