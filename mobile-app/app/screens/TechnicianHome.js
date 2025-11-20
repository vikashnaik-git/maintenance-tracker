// app/screens/TechnicianHome.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";

function onlyDate(ts){
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function TechnicianHome({ route, navigation }) {
  const { empId } = route.params;
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const today = new Date();
    const q = query(
      collection(db, "assignments"),
      where("assigned_to", "==", empId),
      where("status", "==", "open")
    );
    const unsub = onSnapshot(q, snap => {
      const out = [];
      snap.forEach(d => {
        const data = { id: d.id, ...d.data() };
        // show only if due_date <= today (or you can show all open)
        if (!data.due_date) { out.push(data); }
        else {
          const due = data.due_date.toDate ? data.due_date.toDate() : new Date(data.due_date);
          const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          if (dueDateOnly <= todayOnly) out.push(data);
        }
      });
      setAssignments(out);
    });
    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today's Assignments</Text>
      {assignments.length === 0 ? (
        <Text>No assignments due today.</Text>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={i => i.id}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.card}
              onPress={() => navigation.navigate("TechnicianTaskForm", { assignmentId: item.id, taskId: item.task_id, equipmentId: item.equipment_id, empId })}
            >
              <Text style={styles.title}>{item.task_title || item.task_id}</Text>
              <Text>Equipment: {item.equipment_id}</Text>
              <Text>Due: {item.due_date ? (item.due_date.toDate ? item.due_date.toDate().toLocaleDateString() : new Date(item.due_date).toLocaleDateString()) : 'N/A'}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,padding:20},
  heading:{fontSize:22,fontWeight:"bold",marginBottom:12},
  card:{padding:12,backgroundColor:"#f2f2f2",borderRadius:8,marginBottom:10},
  title:{fontSize:16,fontWeight:"600"}
});
