import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import { FaUsers, FaCalendarCheck, FaPhone, FaEnvelope, FaTasks, FaBolt, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, LabelList } from "recharts";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        alert("Erreur lors du chargement des statistiques");
      }
    };

    const fetchDailyStats = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/stats/daily", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDailyStats(res.data);
      } catch (err) {
        console.error(err);
        alert("Erreur lors du chargement des statistiques quotidiennes");
      }
    };

    fetchStats();
    fetchDailyStats();
  }, []);

  if (!stats) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  const cards = [
    { title: "Visitors", value: stats.visitorsToday, icon: <FaUsers />, color: "#0d6efd" },
    { title: "Appointments", value: stats.appointments, icon: <FaCalendarCheck />, color: "#198754" },
    { title: "Calls", value: stats.calls, icon: <FaPhone />, color: "#fd7e14" },
    { title: "Mails", value: stats.mails, icon: <FaEnvelope />, color: "#6f42c1" },
    { title: "Tasks Open", value: stats.tasksOpen, icon: <FaTasks />, color: "#dc3545" },
    { title: "Consommation", value: stats.consommation, icon: <FaBolt />, color: "#0dcaf0" },
  ];

  const barData = cards.map(card => ({ name: card.title, value: card.value, color: card.color }));

  // 🔹 Fonction pour ajouter des icônes dynamiques sur le graphique quotidien
  const formatDailyData = dailyStats.map((day, index, arr) => {
    const prev = arr[index - 1];
    const deltaVisitors = prev ? day.visitors - prev.visitors : 0;
    const deltaAppointments = prev ? day.appointments - prev.appointments : 0;
    return {
      ...day,
      visitorsIndicator: deltaVisitors > 0 ? "up" : deltaVisitors < 0 ? "down" : "same",
      appointmentsIndicator: deltaAppointments > 0 ? "up" : deltaAppointments < 0 ? "down" : "same",
    };
  });

  return (
    <div className="p-3">

      {/* ===================== CARTES STATISTIQUES ===================== */}
      <Row className="g-3 mb-4">
        {cards.map((card, idx) => (
          <Col md={4} key={idx}>
            <Card className="shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <div style={{ fontSize: "2rem", color: card.color, marginRight: "1rem" }}>
                  {card.icon}
                </div>
                <div>
                  <h5>{card.title}</h5>
                  <h2>{card.value}</h2>
                  {/* 🔹 Affiche une flèche dynamique selon évolution */}
                  {stats.prevStats && stats.prevStats[card.title.toLowerCase()] !== undefined && (
                    <small>
                      {card.value > stats.prevStats[card.title.toLowerCase()] ? (
                        <span style={{ color: "green" }}><FaArrowUp /> ↑</span>
                      ) : card.value < stats.prevStats[card.title.toLowerCase()] ? (
                        <span style={{ color: "red" }}><FaArrowDown /> ↓</span>
                      ) : null}
                    </small>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ===================== GRAPHIQUE EN BARRES ===================== */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5>Résumé des statistiques</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                {/* 🔹 Ajout d'étiquettes de valeur sur chaque barre */}
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      {/* ===================== GRAPHIQUE ÉVOLUTION QUOTIDIENNE ===================== */}
      <Card className="mt-4 shadow-sm">
        <Card.Body>
          <h5>Évolution quotidienne (7 derniers jours)</h5>
          {dailyStats.length === 0 ? (
            <Spinner animation="border" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatDailyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" name="Visiteurs" stroke="#007bff">
                  <LabelList dataKey="visitorsIndicator" content={({ x, y, value }) => {
                    if(value === "up") return <text x={x} y={y-10} fill="green">↑</text>;
                    if(value === "down") return <text x={x} y={y-10} fill="red">↓</text>;
                    return null;
                  }}/>
                </Line>
                <Line type="monotone" dataKey="appointments" name="Rendez-vous" stroke="#28a745">
                  <LabelList dataKey="appointmentsIndicator" content={({ x, y, value }) => {
                    if(value === "up") return <text x={x} y={y-10} fill="green">↑</text>;
                    if(value === "down") return <text x={x} y={y-10} fill="red">↓</text>;
                    return null;
                  }}/>
                </Line>
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Dashboard;
