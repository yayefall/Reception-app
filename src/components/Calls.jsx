import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete ,apiPut} from "../Api.jsx";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Card, Button, Form, Table, Modal, Row, Col, Alert, Pagination } from "react-bootstrap";

function Calls() {
  const [calls, setCalls] = useState([]);
  const [form, setForm] = useState({
    caller_name: "",
    phone: "",
    message: "",
    transferred_to: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Recherche
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadCalls = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/calls");
        setCalls(data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des appels");
      } finally {
        setLoading(false);
      }
    };
    loadCalls();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiPut(`/calls/${editingId}`, form);
        setEditingId(null);
      } else {
        await apiPost("/calls", form);
      }
      setForm({ caller_name: "", phone: "", message: "", transferred_to: "" });
      setShowModal(false);
      const data = await apiGet("/calls");
      setCalls(data.data);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ou modifier l'appel");
    }
  };

  const handleEdit = (c) => {
    setForm({
      caller_name: c.caller_name,
      phone: c.phone,
      message: c.message,
      transferred_to: c.transferred_to
    });
    setEditingId(c.id);
    setShowModal(true);
  };

 const handleDelete = async (id) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet appel ?")) {
    return; // l’utilisateur a annulé
  }
    setError("");
    try {
      await apiDelete(`/calls/${id}`);
      setCalls(calls.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer l'appel");
    }
  };

  // 🔎 Filtrer selon recherche
  const filteredCalls = calls.filter(c =>
    c.caller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.transferred_to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic appliquée sur les résultats filtrés
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCalls = filteredCalls.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      {/* Ligne boutons + recherche */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button
          variant="primary"
          onClick={() => {
            setShowModal(true);
            setEditingId(null);
            setForm({ caller_name: "", phone: "", message: "", transferred_to: "" });
          }}
        >
          Add Call
        </Button>

        <Form className="d-flex" style={{ maxWidth: "300px" }}>
          <Form.Control
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // 🔄 reset page au début si recherche
            }}
          />
        </Form>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex justify-content-center align-items-center">
          <span className="fw-bold fs-5">Liste des appels</span>
        </Card.Header>
        <Card.Body>
          {loading ? <p>Chargement...</p> : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Caller Name</th>
                    <th>Phone</th>
                    <th>Message</th>
                    <th>Transferred To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCalls.map(c => (
                    <tr key={c.id}>
                      <td>{c.caller_name}</td>
                      <td>{c.phone}</td>
                      <td>{c.message}</td>
                      <td>{c.transferred_to}</td>
                      <td className="text-center">
                        <FaEdit
                          onClick={() => handleEdit(c)}
                          title="Modifier"
                          style={{ cursor: "pointer", color: "blue", marginRight: "10px" }}
                        />
                        <FaTrash
                          onClick={() => handleDelete(c.id)}
                          title="Supprimer"
                          style={{ cursor: "pointer", color: "red" }}
                        />
                      </td>
                    </tr>
                  ))}
                  {currentCalls.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        Aucun résultat trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === currentPage}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
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

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Modifier l'appel" : "Ajouter un appel"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control
                  name="caller_name"
                  value={form.caller_name}
                  onChange={handleChange}
                  placeholder="Caller Name"
                  required
                  className="mb-3"
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="mb-3"
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Message"
                  className="mb-3"
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  name="transferred_to"
                  value={form.transferred_to}
                  onChange={handleChange}
                  placeholder="Transferred To"
                  className="mb-3"
                />
              </Col>
            </Row>
            <Button type="submit" variant="primary" className="w-100">
              {editingId ? "Modifier" : "Ajouter"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}


export default  Calls