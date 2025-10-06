import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete,apiPut } from "../Api.jsx";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Card, Button, Form, Table, Modal, Row, Col, Alert, Pagination } from "react-bootstrap";

function Mail() {
  const [mails, setMails] = useState([]);
  const [form, setForm] = useState({ type: "", sender: "", recipient: "", received_at: "", status: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadMails = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/mail");
        setMails(data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des mails");
      } finally {
        setLoading(false);
      }
    };
    loadMails();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiPut(`/mail/${editingId}`, form);
        setEditingId(null);
      } else {
        await apiPost("/mail", form);
      }
      setForm({ type: "", sender: "", recipient: "", received_at: "", status: "" });
      setShowModal(false);
      const data = await apiGet("/mail");
      setMails(data.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ou modifier le mail");
    }
  };

  const handleEdit = (m) => {
    setForm({
      type: m.type,
      sender: m.sender,
      recipient: m.recipient,
      received_at: m.received_at ? m.received_at.slice(0,16) : "",
      status: m.status,
    });
    setEditingId(m.id);
    setShowModal(true);
  };

 const handleDelete = async (id) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet email ?")) {
    return; // l’utilisateur a annulé
  }
    setError("");
    try {
      await apiDelete(`/mail/${id}`);
      setMails(mails.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer le mail");
    }
  };

  // Filtrer + Pagination
  const filteredMails = mails.filter(
         m => m.type.toLowerCase().includes(search.toLowerCase()) ||
         m.sender.toLowerCase().includes(search.toLowerCase()) ||
         m.recipient.toLowerCase().includes(search.toLowerCase()) ||
         m.status.toLowerCase().includes(search.toLowerCase())||
         m.received_at.toLowerCase().includes(search.toLowerCase())


  );

  const totalPages = Math.ceil(filteredMails.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMails = filteredMails.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <Button
              variant="primary"
              className="me-2"
              onClick={() => { setShowModal(true); setEditingId(null); setForm({ type: "", sender: "", recipient: "", received_at: "", status: "" }); }}
            >
              Add Mail
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
          <span className="fw-bold fs-5">Liste des mails</span>
         
        </Card.Header>

        <Card.Body>
          {loading ? <p>Chargement...</p> : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Sender</th>
                    <th>Recipient</th>
                    <th>Received At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMails.map((m) => (
                    <tr key={m.id}>
                      <td>{m.type}</td>
                      <td>{m.sender}</td>
                      <td>{m.recipient}</td>
                      <td>{m.received_at ? new Date(m.received_at).toLocaleString() : ""}</td>
                      <td>{m.status}</td>
                      <td className="text-center">
                        <FaEdit onClick={() => handleEdit(m)} style={{ cursor: "pointer", color: "blue", marginRight: "10px" }} />
                        <FaTrash onClick={() => handleDelete(m.id)} style={{ cursor: "pointer", color: "red" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="justify-content-center mt-3">
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage===1}/>
                  <Pagination.Prev onClick={() => handlePageChange(currentPage-1)} disabled={currentPage===1}/>
                  {[...Array(totalPages)].map((_, idx) => (
                    <Pagination.Item key={idx+1} active={idx+1===currentPage} onClick={() => handlePageChange(idx+1)}>
                      {idx+1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => handlePageChange(currentPage+1)} disabled={currentPage===totalPages}/>
                  <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage===totalPages}/>
                </Pagination>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Modifier un mail" : "Ajouter un mail"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Control name="type" value={form.type} onChange={handleChange} placeholder="Type" required className="mb-3" />
              </Col>
              <Col md={6}>
                <Form.Control name="sender" value={form.sender} onChange={handleChange} placeholder="Sender" className="mb-3"/>
              </Col>
              <Col md={6}>
                <Form.Control name="recipient" value={form.recipient} onChange={handleChange} placeholder="Recipient" className="mb-3"/>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control type="datetime-local" name="received_at" value={form.received_at} onChange={handleChange} className="mb-3"/>
              </Col>
              <Col md={6}>
                <Form.Control name="status" value={form.status} onChange={handleChange} placeholder="Status" className="mb-3"/>
              </Col>
            </Row>
            <Button type="submit" variant="primary" className="w-100">{editingId ? "Modifier" : "Ajouter"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}


export default  Mail