/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { apiGet } from "../Api.jsx";
import autoTable from "jspdf-autotable";
import { Card, Row, Col, Spinner, Button, Modal, Table, Form, Pagination, InputGroup } from "react-bootstrap";
import axios from "axios";
import {
  FaUsers,
  FaCalendarCheck,
  FaPhone,
  FaEnvelope,
  FaTasks,
  FaBolt,
  FaArrowUp,
  FaArrowDown,
  FaEdit,
  FaTrash,
  
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  LabelList,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const token = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

    // ---------------- CLEANER STATES ----------------
  const [cleaners, setCleaners] = useState([]);
  const [showCleaner, setShowCleaner] = useState(false);
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [newCleaner, setNewCleaner] = useState({
    id: null,
    nomComplet: "",
    fonction: "",
    telephone: "",
    lieu: "",
    localisation: "",
  });
// filtrer selon la recherche
const filteredCleaners = cleaners.filter((c) =>
  Object.values(c).some((val) =>
    String(val).toLowerCase().includes(search.toLowerCase())
  )
);

// pagination
const totalPages = Math.ceil(filteredCleaners.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCleaners = filteredCleaners.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  // ---------------- API STATS ----------------
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

  if (!stats)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );

  const cards = [
    { title: "Visitors", value: stats.visitorsToday, icon: <FaUsers />, color: "#0d6efd" },
    { title: "Appointments", value: stats.appointments, icon: <FaCalendarCheck />, color: "#198754" },
    { title: "Calls", value: stats.calls, icon: <FaPhone />, color: "#fd7e14" },
    { title: "Mails", value: stats.mails, icon: <FaEnvelope />, color: "#6f42c1" },
    { title: "Tasks Open", value: stats.tasksOpen, icon: <FaTasks />, color: "#dc3545" },
    { title: "Consommation", value: stats.consommation, icon: <FaBolt />, color: "#0dcaf0" },
  ];

  const barData = cards.map((card) => ({ name: card.title, value: card.value, color: card.color }));

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
/***************************************************************************** */

// ---------------- EXPORT FUNCTIONS ----------------

// ✅ Export Excel en excluant dynamiquement certaines colonnes
const exportToExcel = () => {
  const excludedColumns = ["id", "created_at"]; // colonnes à exclure

  const dataToExport = cleaners.map(item => {
    const filteredItem = {};
    Object.keys(item).forEach(key => {
      if (!excludedColumns.includes(key)) {
        filteredItem[key] = item[key];
      }
    });
    return filteredItem;
  });

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cleaners");
  XLSX.writeFile(wb, "cleaners.xlsx");
}


// ✅ Export PDF
  const exportToPDF = async () => {
    try {
      const response = await apiGet("/cleaner"); // Remplacez par votre endpoint
      const dataConsos = Array.isArray(response) ? response : response.data || [];

      if (dataConsos.length === 0) {
        alert("Aucune cleaner à exporter !");
        return;
      }

      const doc = new jsPDF();

      // Logo facultatif
      const img = new Image();
      img.src = "/chec2.png"; 
      img.onload = () => generatePDF(doc, dataConsos, img);
      img.onerror = () => generatePDF(doc, dataConsos, null);
    } catch (err) {
      console.error("Erreur PDF :", err);
      alert("Impossible de générer le PDF. Vérifiez la console.");
    }
  };

  const generatePDF = (doc, dataConsos, logo) => {
  if (logo) doc.addImage(logo, "PNG", 10, 5, 30, 30);

  doc.setFontSize(18);
  doc.text("Liste des Cleaners", 105, 20, { align: "center" });

  // Ajouter la colonne "N°" pour la numérotation
  const tableColumn = ["N°", "Nom complet", "Fonction", "Téléphone", "Lieu", "Localisation"];
  
  // Ajouter l'index + 1 comme première colonne
  const tableRows = dataConsos.map((c, index) => [
    index + 1,
    c.nomComplet,
    c.fonction,
    c.telephone,
    c.lieu,
    c.localisation,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { cellPadding: 3, fontSize: 10 },
  });

  const dateNow = new Date().toLocaleString();
  doc.setFontSize(10);
  doc.text(`Document généré le ${dateNow}`, 14, doc.internal.pageSize.height - 10);

  doc.save("consommations.pdf");
};



// ---------------- CLEANER FUNCTIONS  Lister tous les cleaners----------------
   const fetchCleaners = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/cleaner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCleaners(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };
    const handleShowCleaner = () => {
      fetchCleaners();   // 🔥 Charger les cleaners avant d’ouvrir la modale
      setShowCleaner(true);
    };

    
  const handleCloseCleaner = () => setShowCleaner(false);
  const handleShowAddCleaner = () => setShowAddCleaner(true);
  const handleCloseAddCleaner = () => {
    setShowAddCleaner(false);
    setNewCleaner({
      id: null,
      nomComplet: "",
      fonction: "",
      telephone: "",
      lieu: "",
      localisation: "",
    });
  };

  const handleChange = (e) => {
    setNewCleaner({ ...newCleaner, [e.target.name]: e.target.value });
  };
// ✅ Ajouter ou modifier un cleaner
  const handleSaveCleaner = async () => {
    try {
      if (newCleaner.id) {
        // update
        await axios.put(`http://localhost:4000/api/cleaner/${newCleaner.id}`, newCleaner, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // create
        await axios.post("http://localhost:4000/api/cleaner", newCleaner, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchCleaners();
      handleCloseAddCleaner();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCleaner = (u) => {
    setNewCleaner(u);
    setShowAddCleaner(true); // ✅ ouvrir la modale de formulaire
  };
// ✅ Supprimer un cleaner
  const handleDeleteCleaner = async (id) => {
     if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce cleaner ?")) {
    return; // l’utilisateur a annulé
    }
    try {
      await axios.delete(`http://localhost:4000/api/cleaner/${id}`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ ajouter le token
      });
      fetchCleaners();
    } catch (err) {
      console.error(err);
    }
  };
/***************************************************************************** */
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
                  {stats.prevStats && stats.prevStats[card.title.toLowerCase()] !== undefined && (
                    <small>
                      {card.value > stats.prevStats[card.title.toLowerCase()] ? (
                        <span style={{ color: "green" }}>
                          <FaArrowUp /> ↑
                        </span>
                      ) : card.value < stats.prevStats[card.title.toLowerCase()] ? (
                        <span style={{ color: "red" }}>
                          <FaArrowDown /> ↓
                        </span>
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
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      {/* ===================== GRAPHIQUE QUOTIDIEN ===================== */}
      <Card className="mt-4 shadow-sm mb-4">
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
                  <LabelList
                    dataKey="visitorsIndicator"
                    content={({ x, y, value }) => {
                      if (value === "up") return <text x={x} y={y - 10} fill="green">↑</text>;
                      if (value === "down") return <text x={x} y={y - 10} fill="red">↓</text>;
                      return null;
                    }}
                  />
                </Line>
                <Line type="monotone" dataKey="appointments" name="Rendez-vous" stroke="#28a745">
                  <LabelList
                    dataKey="appointmentsIndicator"
                    content={({ x, y, value }) => {
                      if (value === "up") return <text x={x} y={y - 10} fill="green">↑</text>;
                      if (value === "down") return <text x={x} y={y - 10} fill="red">↓</text>;
                      return null;
                    }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

      {/* ===================== BOUTON CLEANERS ===================== */}
    
   <Button onClick={handleShowCleaner}>Voir Cleaners</Button>
  
      {/* Liste des cleaners */}
<Modal show={showCleaner} onHide={handleCloseCleaner} size="lg">
  
     
  <Modal.Body>
 {/* Ligne de contrôle Cleaners */}
<Row className="align-items-center mb-3">
  {/* Bouton Ajouter Cleaner */}
  <Col xs={12} md={4} className="mb-2 mb-md-0">
    <Button onClick={handleShowAddCleaner} className="w-100 w-md-auto">
      Ajouter Cleaner
    </Button>
  </Col>

  {/* Boutons Export */}
  <Col xs={12} md={4} className="mb-2 mb-md-0 d-flex justify-content-md-center">
    <Button variant="success" className="me-2" onClick={exportToExcel}>
      XLSX
    </Button>
    <Button variant="danger" onClick={exportToPDF}>
       PDF
    </Button>
  </Col>

  {/* Barre de recherche */}
  <Col xs={12} md={4} className="d-flex justify-content-md-end">
    <InputGroup style={{ maxWidth: "300px", width: "100%" }}>
      <Form.Control
        placeholder="Rechercher un cleaner..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />
    </InputGroup>
  </Col>
</Row>

 <Card className="shadow-sm mb-3">
   <Card.Header className="d-flex justify-content-center align-items-center">
       <span className="fw-bold fs-5">Liste des Cleaners</span>
   </Card.Header>

   <Card.Body>
     <Table striped bordered hover responsive>
       <thead>
         <tr>
           <th>Nom</th>
           <th>Fonction</th>
           <th>Téléphone</th>
           <th>Lieu</th>
           <th>Localisation</th>
           <th colSpan={2}>Actions</th>
         </tr>
       </thead>
       <tbody>
         {currentCleaners.map((c) => (
           <tr key={c.id}>
             <td>{c.nomComplet}</td>
             <td>{c.fonction}</td>
             <td>{c.telephone}</td>
             <td>{c.lieu}</td>
             <td>{c.localisation}</td>
             <td>
               <FaEdit
                 style={{ cursor: "pointer", color: "blue" }}
                 onClick={() => handleEditCleaner(c)}
               />
             </td>
             <td>
               <FaTrash
                 style={{ cursor: "pointer", color: "red" }}
                 onClick={() => handleDeleteCleaner(c.id)}
               />
             </td>
           </tr>
         ))}
       </tbody>
     </Table>
   </Card.Body>
 </Card>
  

    {/* 🔄 Pagination */}
    {totalPages > 1 && (
                  <Pagination className="justify-content-center mt-3">
                    <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    {[...Array(totalPages)].map((_, idx) => (
                      <Pagination.Item key={idx + 1} active={idx + 1 === currentPage} onClick={() => handlePageChange(idx + 1)}>
                        {idx + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                )}
              
  </Modal.Body>
</Modal>


      {/* Ajout / Modification cleaner */}
   <Modal show={showAddCleaner} onHide={handleCloseAddCleaner}>
  <Modal.Header closeButton>
    <Modal.Title>
      {newCleaner.id ? "Modifier Cleaner" : "Ajouter Cleaner"}
    </Modal.Title>
  </Modal.Header>
  <Form onSubmit={handleSaveCleaner}>   {/* ✅ mettre le form ici */}
    <Modal.Body>
      <Form.Control
        className="mb-2"
        name="nomComplet"
        placeholder="Nom Complet"
        value={newCleaner.nomComplet}
        onChange={handleChange}
        required
      />
      <Form.Control
        className="mb-2"
        name="fonction"
        placeholder="Fonction"
        value={newCleaner.fonction}
        onChange={handleChange}
        required
      />
      <Form.Control
        className="mb-2"
        name="telephone"
        placeholder="Téléphone"
        value={newCleaner.telephone}
        onChange={handleChange}
        required
      />
      <Form.Control
        className="mb-2"
        name="lieu"
        placeholder="Lieu"
        value={newCleaner.lieu}
        onChange={handleChange}
        required
      />
      <Form.Control
        className="mb-2"
        name="localisation"
        placeholder="Localisation"
        value={newCleaner.localisation}
        onChange={handleChange}
        required
      />
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleCloseAddCleaner}>
        Annuler
      </Button>
      <Button variant="primary" type="submit">
        {newCleaner.id ? "Mettre à jour" : "Enregistrer"}
      </Button>
    </Modal.Footer>
  </Form>
</Modal>

    </div>
  );
}

export default Dashboard;
