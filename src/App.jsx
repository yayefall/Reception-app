/** eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import Tabs from "./components/Tabs.jsx";
import Visitors from "./components/Visitors.jsx";
import Appointments from "./components/Appointments.jsx";
import Calls from "./components/Calls.jsx";
import Mail from "./components/Mail.jsx";
import Tasks from "./components/Tasks.jsx";
import Consommation from "./components/Consommation.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Login from "./Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import logo from "./assets/chec2.png";
import { Container, Row, Card, Modal, Button, Form, Table } from "react-bootstrap";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";

function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState("Dashboard");
  const tabs = ["Dashboard", "Visitors", "Appointments", "Calls", "Mail", "Tasks", "Consommation"];

  /**  États pour modals*/
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    id: null,
    name: "",
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/users", {
        withCredentials: true, // 🔑 envoie cookie token
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des utilisateurs");
    }
  };

  // Déconnexion
  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      axios.post("http://localhost:4000/api/logout", {}, { withCredentials: true })
        .finally(() => setUser(null));
    }
  };

  // Ajouter ou modifier utilisateur
  const handleAddOrEditUser = async (e) => {
    e.preventDefault();
    try {
      if (newUser.id) {
        await axios.put(`http://localhost:4000/api/users/${newUser.id}`, newUser, {
          withCredentials: true,
        });
        alert("Utilisateur modifié avec succès !");
      } else {
        await axios.post("http://localhost:4000/api/users", newUser, {
          withCredentials: true,
        });
        alert("Utilisateur ajouté avec succès !");
      }
      setShowAddUserModal(false);
      setNewUser({ id: null, name: "", username: "", email: "", password: "", role: "user" });
      loadUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur réseau");
    }
  };

  const handleEditUser = (u) => {
    setNewUser(u);
    setShowAddUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/users/${id}`, {
        withCredentials: true,
      });
      alert("Utilisateur supprimé !");
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  // au montage, on demande /api/me
  useEffect(() => {
    axios.get("http://localhost:4000/api/me", { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  // Charger users à l’ouverture du modal
  useEffect(() => {
    if (showUserListModal) loadUsers();
  }, [showUserListModal]);

  // Si pas connecté
  if (!user) return <Login onLoginSuccess={setUser} />;

  return (
    <div className="d-flex flex-column vh-100 vw-100 bg-light">
      {/* Header */}
      <header className="py-3 bg-white shadow-sm flex-shrink-0 w-100">
        <div className="d-flex align-items-center justify-content-between px-5">
          <img src={logo} alt="Logo CHEC" style={{ width: "120px", height: "auto", borderRadius: "4px" }} />
          <div className="position-relative flex-grow-1 text-center">
            <h1 className="fw-bold text-primary mb-1" style={{ fontSize: "2rem" }}>Ma Réception</h1>
            <p className="text-secondary mb-0" style={{ fontSize: "1rem" }}>
              Bonjour <strong>{user.name || user.username}</strong>
            </p>
          </div>
          <div className="d-flex gap-2">
            {user.role === "admin" && (
              <Button variant="success" onClick={() => setShowUserListModal(true)}>Gestion Users</Button>
            )}
            <Button variant="primary" onClick={handleLogout}>Déconnexion</Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Container fluid className="mt-3 px-3 flex-shrink-0 w-100">
        <Tabs tabs={tabs} current={currentTab} onChange={setCurrentTab} />
      </Container>

      {/* Main Content */}
      <Container fluid className="flex-grow-1 d-flex flex-column px-3 my-3 w-100" style={{ minHeight: 0 }}>
        <Row className="flex-grow-1 m-0" style={{ minHeight: 0 }}>
          <Card className="shadow-lg w-100 h-100 border-0">
            <Card.Body className="d-flex flex-column p-3 flex-grow-1" style={{ minHeight: 0, overflowY: "auto", width: "100%" }}>
              <ErrorBoundary className="flex-grow-1 w-100">
                {currentTab === "Dashboard" && <Dashboard />}
                {currentTab === "Visitors" && <Visitors />}
                {currentTab === "Appointments" && <Appointments />}
                {currentTab === "Calls" && <Calls />}
                {currentTab === "Mail" && <Mail />}
                {currentTab === "Tasks" && <Tasks />}
                {currentTab === "Consommation" && <Consommation />}
              </ErrorBoundary>
            </Card.Body>
          </Card>
        </Row>
      </Container>

      {/* Footer */}
      <footer className="text-center text-muted py-3 bg-white shadow-sm flex-shrink-0 w-100">
        © {new Date().getFullYear()} Reception Dashboard - All Rights Reserved
      </footer>

      {/* Modal Liste Users */}
      <Modal show={showUserListModal} onHide={() => setShowUserListModal(false)} size="lg" centered>
        <Modal.Header>
          <Modal.Title>Liste des utilisateurs</Modal.Title>
          <Button variant="success" onClick={() => setShowAddUserModal(true)} style={{ marginLeft: "auto" }}>
            Ajouter un utilisateur
          </Button>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th colSpan="2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <FaEdit
                      style={{ cursor: "pointer", color: "blue" }}
                      onClick={() => handleEditUser(u)} />
                  </td>
                  <td>
                    <FaTrash
                      style={{ cursor: "pointer", color: "red" }}
                      onClick={() => handleDeleteUser(u.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>

      {/* Modal Ajouter / Modifier User */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{newUser.id ? "Modifier utilisateur" : "Ajouter un utilisateur"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddOrEditUser}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Nom complet</Form.Label>
              <Form.Control type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Role</Form.Label>
              <Form.Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{newUser.id ? "Modifier" : "Ajouter"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
}

export default App;
