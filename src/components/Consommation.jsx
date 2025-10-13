import React, { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaFilePdf } from "react-icons/fa";
import {
  Card,
  Button,
  Form,
  Table,
  Modal,
  Row,
  Col,
  Alert,
  Pagination,
} from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiGet, apiPost, apiPut, apiDelete } from "../Api.jsx";

function Consommation() {
  const [consos, setConsos] = useState([]);
  const [form, setForm] = useState({
    date_consommation: "",
    objet: "",
    quantite: "",
    nom_complet: "",
    signature: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- Charger les consommations ---
  const loadConsos = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/consommation");
      // gérer tableau direct ou objet.data
      const list = Array.isArray(data) ? data : data.data || [];
      setConsos(list);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des consommations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsos();
  }, []);

  // --- Télécharger PDF ---
  const downloadPDF = async () => {
    try {
      const response = await apiGet("/consommation");
      const dataConsos = Array.isArray(response) ? response : response.data || [];

      if (dataConsos.length === 0) {
        alert("Aucune consommation à exporter !");
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
    doc.text("Liste des consommations", 105, 20, { align: "center" });

    const tableColumn = ["N°", "Date", "Objet", "Quantité", "Nom complet", "Signature"];
 // Ajouter l'index + 1 comme première colonne
  const tableRows = dataConsos.map((c, index) => [
     index + 1,
     new Date(c.date_consommation).toLocaleString(),
      c.objet,
      c.quantite,
      c.nom_complet,
      c.signature || "—",
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

  // --- Form handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiPut(`/consommation/${editingId}`, form);
        setEditingId(null);
      } else {
        await apiPost("/consommation", form);
      }

      setForm({
        date_consommation: "",
        objet: "",
        quantite: "",
        nom_complet: "",
        signature: "",
      });
      setShowModal(false);
      loadConsos();
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ou modifier la consommation");
    }
  };

  const handleEdit = (c) => {
    setForm({
      date_consommation: c.date_consommation ? c.date_consommation.slice(0, 16) : "",
      objet: c.objet,
      quantite: c.quantite,
      nom_complet: c.nom_complet,
      signature: c.signature,
    });
    setEditingId(c.id);
    setShowModal(true);
  };

 const handleDelete = async (id) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette consommation ?")) {
    return; // l’utilisateur a annulé
  }

  setError("");
  try {
    await apiDelete(`/consommation/${id}`);
    setConsos(consos.filter((c) => c.id !== id));
  } catch (err) {
    console.error(err);
    setError("Impossible de supprimer la consommation");
  }
};


  // --- Filtrage + Pagination ---
  const filteredConsos = consos.filter(
    (c) =>
      c.objet.toLowerCase().includes(search.toLowerCase()) ||
      c.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
      c.quantite.toString().includes(search.toLowerCase()) ||
      (c.date_consommation && c.date_consommation.toString().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredConsos.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentConsos = filteredConsos.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      {/* Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Button
            variant="primary"
            className="me-2"
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setForm({ date_consommation: "", objet: "", quantite: "", nom_complet: "", signature: "" });
            }}
          >
            Add Consommation
          </Button>

          <Button variant="success" onClick={downloadPDF}>
            <FaFilePdf className="me-2" />
            Télécharger PDF
          </Button>
        </div>

        <Form className="d-flex" style={{ maxWidth: "300px" }}>
          <Form.Control
            type="text"
            placeholder="Recherche..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Form>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex justify-content-center align-items-center">
          <span className="fw-bold fs-5">Liste des consommations</span>
        </Card.Header>
        <Card.Body>
          {loading ? <p>Chargement...</p> : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Objet</th>
                    <th>Quantité</th>
                    <th>Nom complet</th>
                    <th>Signature</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentConsos.map((c) => (
                    <tr key={c.id}>
                      <td>{new Date(c.date_consommation).toLocaleString()}</td>
                      <td>{c.objet}</td>
                      <td>{c.quantite}</td>
                      <td>{c.nom_complet}</td>
                      <td>{c.signature || "—"}</td>
                      <td className="text-center">
                        <FaEdit
                          onClick={() => handleEdit(c)}
                          style={{ cursor: "pointer", color: "blue", marginRight: "10px" }}
                        />
                        <FaTrash
                          onClick={() => handleDelete(c.id)}
                          style={{ cursor: "pointer", color: "red" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

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
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal Form */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Modifier une consommation" : "Ajouter une consommation"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control type="datetime-local" name="date_consommation" value={form.date_consommation} onChange={handleChange} required className="mb-3" />
              </Col>
              <Col md={6}>
                <Form.Control type="number" name="quantite" value={form.quantite} onChange={handleChange} placeholder="Quantité" required className="mb-3" />
              </Col>
            </Row>
            <Form.Control name="objet" value={form.objet} onChange={handleChange} placeholder="Objet" required className="mb-3" />
            <Form.Control name="nom_complet" value={form.nom_complet} onChange={handleChange} placeholder="Nom complet" required className="mb-3" />
            <Form.Control type="text" name="signature" value={form.signature} onChange={handleChange} placeholder="Signature" className="mb-3" />
            <Button type="submit" variant="primary" className="w-100">{editingId ? "Modifier" : "Ajouter"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Consommation;
