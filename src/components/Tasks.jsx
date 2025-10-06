import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete,apiPut } from "../Api.jsx";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Card, Button, Form, Table, Modal, Alert, Pagination } from "react-bootstrap";

 function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", dueDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/tasks");
        setTasks(data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des tâches");
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiPut(`/tasks/${editingId}`, { title: form.title, due_date: form.dueDate });
        setEditingId(null);
      } else {
        await apiPost("/tasks", { title: form.title, due_date: form.dueDate });
      }
      setForm({ title: "", dueDate: "" });
      setShowModal(false);
      const data = await apiGet("/tasks");
      setTasks(data.data);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter ou modifier la tâche");
    }
  };

  const handleEdit = (t) => {
    setForm({
      title: t.title,
      dueDate: t.due_date ? t.due_date.slice(0,16) : ""
    });
    setEditingId(t.id);
    setShowModal(true);
  };

 const handleDelete = async (id) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
    return; // l’utilisateur a annulé
  }
    setError("");
    try {
      await apiDelete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la tâche");
    }
  };

  // Filter + Pagination
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
            <Button
              variant="primary"
              className="me-2"
              onClick={() => { setShowModal(true); setEditingId(null); setForm({ title: "", dueDate: "" }); }}
            >
              Add Task
            </Button>
         <Form className="d-flex" style={{ maxWidth: "300px" }}>
            <Form.Control
              type="text"
              placeholder="Recherche..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            </Form>
          </div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm mb-3">
        <Card.Header className="d-flex justify-content-center align-items-center">
          <span className="fw-bold fs-5">Liste des tâches</span>
         
        </Card.Header>

        <Card.Body>
          {loading ? <p>Chargement...</p> : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map(t => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{t.due_date ? new Date(t.due_date).toLocaleString() : ""}</td>
                      <td className="text-center">
                        <FaEdit onClick={() => handleEdit(t)} style={{ cursor: "pointer", color: "blue", marginRight: "10px" }} />
                        <FaTrash onClick={() => handleDelete(t.id)} style={{ cursor: "pointer", color: "red" }} />
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
          <Modal.Title>{editingId ? "Modifier la tâche" : "Ajouter une tâche"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Control name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="mb-3" />
            <Form.Control type="datetime-local" name="dueDate" value={form.dueDate} onChange={handleChange} className="mb-3" />
            <Button type="submit" variant="primary" className="w-100">{editingId ? "Modifier" : "Ajouter"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Tasks