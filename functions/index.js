// functions/generateAssignments.js (GEN-1 SAFE VERSION)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Utility: add days
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Utility: keep only date (no time)
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ----------- MAIN SCHEDULED FUNCTION (GEN-1 SYNTAX) -----------------

exports.generateAssignments = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {

    const today = new Date();
    const leadDays = 0; 

    const equipSnap = await db.collection("equipment_master").get();

    for (const eqDoc of equipSnap.docs) {
      const equip = eqDoc.data();
      const equipmentId = equip.equipment_id || eqDoc.id;

      // Get mapped tasks for this equipment
      const mapQuery = await db.collection("equipment_task_map")
        .where("equipment_id_norm", "==", equipmentId)
        .get();

      for (const mapDoc of mapQuery.docs) {
        const { task_id: taskId } = mapDoc.data();
        if (!taskId) continue;

        const taskDoc = await db.collection("maintenance_tasks").doc(taskId).get();
        if (!taskDoc.exists) continue;

        const task = taskDoc.data();
        const freqDays = task.frequency_days;
        if (!freqDays) continue;

        // Get last completed log
        const logs = await db.collection("maintenance_logs")
          .where("equipment_id", "==", equipmentId)
          .where("task_id", "==", taskId)
          .where("status", "==", "approved")
          .orderBy("submitted_at", "desc")
          .limit(1)
          .get();

        let lastDate = null;
        if (!logs.empty) {
          const ts = logs.docs[0].data().submitted_at;
          lastDate = ts.toDate ? ts.toDate() : new Date(ts);
        }

        // Calculate next due
        let nextDue;
        if (lastDate) {
          nextDue = addDays(lastDate, freqDays);
        } else if (equip.startDate) {
          const start = equip.startDate.toDate ? equip.startDate.toDate() : new Date(equip.startDate);
          const diffDays = Math.floor((today - start) / 86400000);
          const cycles = Math.floor(diffDays / freqDays);
          nextDue = addDays(start, (cycles + 1) * freqDays);
        } else {
          continue;
        }

        const cutoff = addDays(today, leadDays);

        if (dateOnly(nextDue) <= dateOnly(cutoff)) {

          // Avoid duplicate assignments
          const existing = await db.collection("assignments")
            .where("equipment_id", "==", equipmentId)
            .where("task_id", "==", taskId)
            .where("due_date", "==", admin.firestore.Timestamp.fromDate(dateOnly(nextDue)))
            .limit(1)
            .get();

          if (!existing.empty) continue;

          // ---------------- ROLE-BASED TECHNICIAN SELECTION ----------------
          let assignedTo = null;

          // 1. If equipment has department → pick engineer from same dept
          if (equip.department) {
            const allotDept = await db.collection("task_allotment")
              .where("department", "==", equip.department)
              .where("designation", "==", "engineer")
              .limit(1)
              .get();

            if (!allotDept.empty) assignedTo = allotDept.docs[0].id;
          }

          // 2. Fallback → any engineer
          if (!assignedTo) {
            const eng = await db.collection("task_allotment")
              .where("designation", "==", "engineer")
              .limit(1)
              .get();

            if (!eng.empty) assignedTo = eng.docs[0].id;
          }

          // 3. Last fallback → unassigned
          if (!assignedTo) assignedTo = "unassigned";

          // ---------------- CREATE ASSIGNMENT ----------------
          await db.collection("assignments").add({
            equipment_id: equipmentId,
            task_id: taskId,
            task_title: task.task_activity || task.task_title || "",
            assigned_to: assignedTo,
            assigned_by: "system",
            status: "open",
            created_at: admin.firestore.Timestamp.now(),
            due_date: admin.firestore.Timestamp.fromDate(dateOnly(nextDue)),
          });

        } // end due check
      } // end task loop
    } // end equipment loop

    return null;
  });

