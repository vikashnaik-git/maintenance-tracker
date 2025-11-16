// web-app/src/pages/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";
import { firestore } from "../../src/firebase"; // adjust path if needed

export default function ManagerDashboard() {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    const unsub = firestore.collection("pending_maintenance_logs")
      .orderBy("timestamp", "desc")
      .onSnapshot(snapshot => {
        setPending(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.error(err));
    return () => unsub();
  }, []);

  async function approve(id) {
    const docRef = firestore.collection("pending_maintenance_logs").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return alert("Not found");
    const data = doc.data();
    // copy to maintenance_logs (permanent)
    await firestore.collection("maintenance_logs").doc(id).set(data);
    // remove pending
    await docRef.delete();
  }

  async function reject(id) {
    await firestore.collection("pending_maintenance_logs").doc(id).delete();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Pending Maintenance Logs</h2>
      {pending.length === 0 && <div>No pending logs</div>}
      {pending.map(p => (
        <div key={p.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8 }}>
          <div><strong>Equipment:</strong> {p.equipment_id}</div>
          <div><strong>Task:</strong> {p.task_id}</div>
          <div><strong>Technician:</strong> {p.technician_name}</div>
          <div><strong>Notes:</strong> {p.notes}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => approve(p.id)}>Approve</button>
            <button onClick={() => reject(p.id)} style={{ marginLeft: 8 }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
