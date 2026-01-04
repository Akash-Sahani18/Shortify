import { useState } from "react";
import axios from "axios";
import { login } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await axios.post("http://localhost:3000/api/login", {
      email,
      password,
    });

    login(res.data.token);
    navigate("/analytics");
  };

  return (
    <div className="app-container">
      <h2 className="app-title">Login</h2>

      <form onSubmit={handleLogin} className="form-group">
        <input
          className="url-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="url-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn">Login</button>
      </form>
    </div>
  );
}
