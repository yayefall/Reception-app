import React from "react";
import "./Tabs.css";
import { FaUsers, FaCalendarCheck, FaPhone, FaEnvelope, FaTasks,FaShoppingCart,FaTachometerAlt } from "react-icons/fa";

const iconMap = {
  Dashboard: <FaTachometerAlt className="me-2" />, 
  Visitors: <FaUsers className="me-1" />,
  Appointments: <FaCalendarCheck className="me-2" />,
  Calls: <FaPhone className="me-3" />,
  Mail: <FaEnvelope className="me-2" />,
  Tasks: <FaTasks className="me-2" />,
  Consommation: <FaShoppingCart className="me-2" />,
};

const Tabs = ({ tabs, current, onChange }) => {
  return (
    <div className="tabs-container">
      <div className="tabs-scroll">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${current === tab ? "active" : ""}`}
            onClick={() => onChange(tab)}
          >
            {iconMap[tab]} {/* Icône avant le texte */}
            {tab}
          </button>
        ))}
      </div>
      <div
        className="active-indicator"
        style={{
          transform: `translateX(${tabs.indexOf(current) * 100}%)`,
          width: `${100 / tabs.length}%`,
        }}
      />
    </div>
  );
};

export default Tabs;
