import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete,apiPut } from "../Api.jsx";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Card, Button, Form, Table, Modal, Row, Col, Alert, Pagination } from "react-bootstrap";

 function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState({ fullName: "", company: "", purpose: "", host: "", departure: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");          // Recherche
  const [currentPage, setCurrentPage] = useState(1); // Pagination
  const itemsPerPage = 5;

  useEffect(() => {
    const loadVisitors = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/visitors");
        setVisitors(data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des visiteurs");
      } finally {
        setLoading(false);
      }
    };
    loadVisitors();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiPut(`/visitors/${editingId}`, {
          full_name: form.fullName,
          company: form.company,
          purpose: form.purpose,
          host_department: form.host,
          departure_time: form.departure
        });
        setEditingId(null);
      } else {
        await apiPost("/visitors", {
          full_name: form.fullName,
          company: form.company,
          purpose: form.purpose,
          host_department: form.host,
          departure_time: form.departure
        });
      }
      setForm({ fullName: "", company: "", purpose: "", host: "", departure: "" });
      setShowModal(false);
      const data = await apiGet("/visitors");
      setVisitors(data.data);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ou modifier le visiteur");
    }
  };

  const handleEdit = (v) => {
    setForm({
      fullName: v.full_name,
      company: v.company,
      purpose: v.purpose,
      host: v.host_department,
      departure: v.departure_time ? v.departure_time.slice(0,16) : ""
    });
    setEditingId(v.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce visiteur ?")) {
    return; // l’utilisateur a annulé
  }
    setError("");
    try {
      await apiDelete(`/visitors/${id}`);
      setVisitors(visitors.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer le visiteur");
    }
  };

  // Filter visitors by search
  const filteredVisitors = visitors.filter(v =>
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.company.toLowerCase().includes(search.toLowerCase()) ||
    v.purpose.toLowerCase().includes(search.toLowerCase()) ||
    v.host_department.toLowerCase().includes(search.toLowerCase())||
    v.departure.toLowerCase().includes(search.toLowerCase())

  );

  // Pagination
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-3">
         <Button
              variant="primary"
              onClick={() => { setShowModal(true); setEditingId(null); setForm({ fullName: "", company: "", purpose: "", host: "", departure: "" }); }}
            >
              Add visitor
           </Button>
          <Form className="d-flex" style={{ maxWidth: "300px" }}>
            <Form.Control
              type="text"
              placeholder="Recherche..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="me-2"
            />
            </Form>
           
          </div>
      {error && <Alert variant="danger">{error}</Alert>}
     
      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex justify-content-center align-items-center">
          <span className="fw-bold fs-5">Liste des visiteurs</span>
        
        </Card.Header>

        <Card.Body>
          {loading ? <p>Chargement...</p> : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Company</th>
                    <th>Purpose</th>
                    <th>Host Department</th>
                    <th>Departure Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVisitors.map(v => (
                    <tr key={v.id}>
                      <td>{v.full_name}</td>
                      <td>{v.company}</td>
                      <td>{v.purpose}</td>
                      <td>{v.host_department}</td>
                      <td>{v.departure_time ? new Date(v.departure_time).toLocaleString() : ""}</td>
                      <td className="text-center">
                        <FaEdit onClick={() => handleEdit(v)} style={{ cursor: "pointer", color: "blue", marginRight: "10px" }} />
                        <FaTrash onClick={() => handleDelete(v.id)} style={{ cursor: "pointer", color: "red" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item key={index+1} active={index+1 === currentPage} onClick={() => handlePageChange(index+1)}>
                      {index+1}
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
          <Modal.Title>{editingId ? "Modifier un visiteur" : "Ajouter un visiteur"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Control name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" required />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}><Form.Control name="company" value={form.company} onChange={handleChange} placeholder="Company" /></Col>
              <Col md={6}><Form.Control name="purpose" value={form.purpose} onChange={handleChange} placeholder="Purpose" /></Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}><Form.Control name="host" value={form.host} onChange={handleChange} placeholder="Host Department" /></Col>
              <Col md={6}><Form.Control type="datetime-local" name="departure" value={form.departure} onChange={handleChange} /></Col>
            </Row>
            <Button type="submit" variant="primary" className="w-100">{editingId ? "Modifier" : "Ajouter"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Visitors;