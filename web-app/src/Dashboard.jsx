import { useEffect, useState } from "react";
import { getUserRole } from "./firestoreService";

export default function Dashboard({ user }) {
  const [role, setRole] = useState("");

  useEffect(() => {
    async function loadRole() {
      const userRole = await getUserRole(user.uid);
      setRole(userRole);
    }
    loadRole();
  }, [user.uid]);

  if (!role) return <h2>Loading dashboard...</h2>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome {role === "manager" ? "Manager" : "Technician"}</h1>

      {role === "manager" ? (
        <>
          <h2>📌 Pending Approvals</h2>
        </>
      ) : (
        <>
          <h2>🔧 Submit Pump Status</h2>
        </>
      )}
    </div>
  );
}
