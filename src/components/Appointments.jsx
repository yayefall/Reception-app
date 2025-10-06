import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete ,apiPut} from "../Api.jsx";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Card, Button, Form, Table, Modal, Row, Col, Alert, Pagination } from "react-bootstrap";

 function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ title: "", withPerson: "", location: "", start: "", end: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/appointments");
        setAppointments(data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des rendez-vous");
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiPut(`/appointments/${editingId}`, {
          title: form.title,
          with_person: form.withPerson,
          location: form.location,
          start_time: form.start,
          end_time: form.end,
          notes: form.notes
        });
        setEditingId(null);
      } else {
        await apiPost("/appointments", {
          title: form.title,
          with_person: form.withPerson,
          location: form.location,
          start_time: form.start,
          end_time: form.end,
          notes: form.notes
        });
      }
      setForm({ title: "", withPerson: "", location: "", start: "", end: "", notes: "" });
      setShowModal(false);
      const data = await apiGet("/appointments");
      setAppointments(data.data);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ou modifier le rendez-vous");
    }
  };

  const handleEdit = (appt) => {
    setForm({
      title: appt.title,
      withPerson: appt.with_person,
      location: appt.location,
      start: appt.start_time ? appt.start_time.slice(0,16) : "",
      end: appt.end_time ? appt.end_time.slice(0,16) : "",
      notes: appt.notes
    });
    setEditingId(appt.id);
    setShowModal(true);
  };

 const handleDelete = async (id) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
    return; // l’utilisateur a annulé
  }
    setError("");
    try {
      await apiDelete(`/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer le rendez-vous");
    }
  };

  // Filter + Pagination
  const filteredAppointments = appointments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.with_person.toLowerCase().includes(search.toLowerCase())||
    a.location.toLowerCase().includes(search.toLowerCase())||
    a.notes.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
            <Button
              variant="primary"
              className="me-2"
              onClick={() => { setShowModal(true); setEditingId(null); setForm({ title: "", withPerson: "", location: "", start: "", end: "", notes: "" }); }}
            >
              Add Appointment
            </Button>
           <Form className="d-flex" style={{ maxWidth: "300px" }}>
            <Form.Control
              type="text"
              placeholder="Recherche..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            </Form>
          </div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex justify-content-center align-items-center">
          <span className="fw-bold fs-5">Liste des rendez-vous</span>
        
        </Card.Header>

        <Card.Body>
          {loading ? <p>Chargement...</p> : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>With Person</th>
                    <th>Location</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAppointments.map(a => (
                    <tr key={a.id}>
                      <td>{a.title}</td>
                      <td>{a.with_person}</td>
                      <td>{a.location}</td>
                      <td>{new Date(a.start_time).toLocaleString()}</td>
                      <td>{new Date(a.end_time).toLocaleString()}</td>
                      <td>{a.notes}</td>
                      <td className="text-center">
                        <FaEdit onClick={() => handleEdit(a)} style={{ cursor: "pointer", color: "blue", marginRight: "10px" }} />
                        <FaTrash onClick={() => handleDelete(a.id)} style={{ cursor: "pointer", color: "red" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  {[...Array(totalPages)].map((_, idx) => (
                    <Pagination.Item key={idx+1} active={idx+1 === currentPage} onClick={() => handlePageChange(idx+1)}>
                      {idx+1}
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Modifier le rendez-vous" : "Ajouter un rendez-vous"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Control name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="mb-3" />
              </Col>
              <Col md={6}>
                <Form.Control name="withPerson" value={form.withPerson} onChange={handleChange} placeholder="With Person" className="mb-3" />
              </Col>
              <Col md={6}>
                <Form.Control name="location" value={form.location} onChange={handleChange} placeholder="Location" className="mb-3" />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control type="datetime-local" name="start" value={form.start} onChange={handleChange} className="mb-3" />
              </Col>
              <Col md={6}>
                <Form.Control type="datetime-local" name="end" value={form.end} onChange={handleChange} className="mb-3" />
              </Col>
            </Row>
            <Form.Control as="textarea" rows={2} name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="mb-3" />
            <Button type="submit" variant="primary" className="w-100">{editingId ? "Modifier" : "Ajouter"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}



export default  Appointments