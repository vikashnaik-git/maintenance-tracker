// app/screens/LoginScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [empId, setEmpId] = useState("");

  const handleLogin = async () => {
    if (!empId.trim()) {
      Alert.alert("Enter Employee ID");
      return;
    }
    try {
      const ref = doc(db, "task_allotment", empId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        Alert.alert("Employee not found");
        return;
      }
      const data = snap.data();
      const des = (data.designation || "").toLowerCase();
      if (des.includes("engineer")) {
        navigation.replace("TechnicianHome", { empId });
      } else if (des.includes("manager") || des.includes("dept")) {
        navigation.replace("ManagerHome", { empId });
      } else {
        Alert.alert("Designation not recognized");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Login error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maintenance Tracker</Text>
      <TextInput
        placeholder="Employee ID (e.g. EMP001)"
        value={empId}
        onChangeText={setEmpId}
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, justifyContent:"center", padding:20 },
  title: { fontSize:26, fontWeight:"bold", marginBottom:20 },
  input: { borderWidth:1, padding:10, marginBottom:12, borderRadius:6 }
});
