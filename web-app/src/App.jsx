import { useState } from "react";
import { loginUser } from "./firebaseAuth";
import Dashboard from "./Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const result = await loginUser(email, password);
      setUser(result.user);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  if (user) return <Dashboard user={user} />;

  return (
    <div style={{ padding: 50 }}>
      <h1>Maintenance Tracker – Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
