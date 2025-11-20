import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ManagerTaskList({ route, navigation }) {
  const { pumpId } = route.params;
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    const q = query(
      collection(db, "submissions"),
      where("pumpId", "==", pumpId)
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setSubmissions(list);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks for Pump {pumpId}</Text>

      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("ManagerTaskReview", {
                submission: item,
              })
            }
          >
            <Text style={styles.label}>Task ID: {item.taskId}</Text>
            <Text>Technician: {item.technicianName}</Text>
            <Text>Vibration: {item.vibrationReading}</Text>
            <Text>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    padding: 15,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    marginBottom: 10,
  },
  label: { fontWeight: "bold" },
});
