import React from "react";
import "./ServicesTab.css";

export default function ServicesTab({
  services,
  pets,
  selectedPet,
  setSelectedPet,
  serviceSelected,
  handleServiceClick,
  availableSlots,
  unavailableSlots,
  handleBookSlot,
}) {
  // Convert slots into a structured calendar by day
  const calendar = {};
  availableSlots.concat(unavailableSlots).forEach((slot) => {
    const [date, time] = slot.split(" ");
    if (!calendar[date]) calendar[date] = [];
    calendar[date].push({ time, slot, available: availableSlots.includes(slot) });
  });

  return (
    <div className="services-tab">
      {/* Service Selection */}
      <h2 className="section-title">Select a Service</h2>
      <div className="services-list">
        {services.map((service, i) => (
          <button
            key={i}
            className={`service-btn ${serviceSelected === service ? "active" : ""}`}
            onClick={() => handleServiceClick(service)}
          >
            {service}
          </button>
        ))}
      </div>

      {/* Pet Selection */}
      {serviceSelected && (
        <>
          <h2 className="section-title">Select Pet</h2>
          <select
            className="pet-selector"
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
          >
            <option value="">Choose a pet</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.name}>
                {pet.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Calendar Scheduler */}
      {serviceSelected && selectedPet && (
        <>
          <h2 className="section-title">Choose a Slot</h2>
          <div className="calendar-table">
            {Object.keys(calendar).map((date) => (
              <div key={date} className="calendar-day">
                <h3>{date}</h3>
                <div className="time-slots">
                  {calendar[date].map(({ time, slot, available }) => (
                    <button
                      key={slot}
                      className={`calendar-slot ${available ? "available" : "unavailable"}`}
                      disabled={!available}
                      onClick={() => available && handleBookSlot(slot)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
