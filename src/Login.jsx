import React, { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import axios from "axios";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 🔑 Appel API login (pose un cookie httpOnly côté serveur)
      const res = await axios.post(
        "http://localhost:4000/api/login",
        { username, password },
        { withCredentials: true } // important pour recevoir le cookie
      );

      // ton backend renvoie { user: {...} } sans token
      const user = res.data.user;
      // facultatif: tu peux stocker une info en localStorage (par exemple rôle)
      localStorage.setItem("userRole", user.role);

      // On notifie le parent que l'utilisateur est connecté
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Username ou mot de passe incorrect");
    }
  };

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center vh-100 bg-light vw-100"
    >
      <Card className="shadow-lg" style={{ width: "400px" }}>
        <Card.Body>
          <div className="text-center mb-4">
            <img
              src="../src/assets/chec2.png"
              alt="Logo"
              style={{ width: "80px", borderRadius: "8px" }}
            />
            <h3 className="mt-3 text-primary fw-bold">CONNEXION</h3>
            <p className="text-muted">Veuillez vous connecter à votre espace</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 fw-bold"
              style={{ fontSize: "1rem" }}
            >
              Se connecter
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
