import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ManagerHome({ navigation }) {
  const [pumps, setPumps] = useState([]);

  useEffect(() => {
    loadPumps();
  }, []);

  const loadPumps = async () => {
    const pumpSnapshot = await getDocs(collection(db, "pumps"));
    const pumpList = [];

    for (let p of pumpSnapshot.docs) {
      const pumpId = p.id;

      // Count pending submissions
      const qPending = query(
        collection(db, "submissions"),
        where("pumpId", "==", pumpId),
        where("status", "==", "pending")
      );
      const subSnap = await getDocs(qPending);

      pumpList.push({
        id: pumpId,
        name: p.data().name,
        location: p.data().location,
        pending: subSnap.size
      });
    }

    setPumps(pumpList);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manager Dashboard</Text>

      <FlatList
        data={pumps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("ManagerTaskList", { pumpId: item.id })
            }
          >
            <Text style={styles.pumpName}>{item.name}</Text>
            <Text>{item.location}</Text>
            <Text style={styles.pendingText}>
              Pending Tasks: {item.pending}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  card: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10,
  },
  pumpName: { fontSize: 18, fontWeight: "bold" },
  pendingText: { marginTop: 5, color: "red", fontWeight: "bold" }
});
