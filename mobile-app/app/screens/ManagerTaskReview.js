// app/screens/ManagerTaskReview.js
import React, { useEffect, useState } from "react";
import { View, Text, Button, Image, TextInput, StyleSheet, Alert } from "react-native";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function ManagerTaskReview({ route, navigation }) {
  const { logId } = route.params;
  const [log, setLog] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(()=>{ load(); }, []);

  async function load(){
    const snap = await getDoc(doc(db, "pending_maintenance_logs", logId));
    if(snap.exists()) setLog({ id: snap.id, ...snap.data() });
    else Alert.alert("Not found");
  }

  async function approve() {
    if (!log) return;
    const approvedDoc = { ...log, status: "approved", approved_at: serverTimestamp(), manager_comments: comment };
    try {
      // write to maintenance_logs (permanent)
      await setDoc(doc(db, "maintenance_logs", log.log_id), approvedDoc);
      // delete pending
      await deleteDoc(doc(db, "pending_maintenance_logs", log.log_id));
      // update assignment
      if (log.assignment_id) {
        await updateDoc(doc(db, "assignments", log.assignment_id), { status: "completed" });
      }
      Alert.alert("Approved");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error approving");
    }
  }

  async function reject() {
    if (!log) return;
    try {
      await updateDoc(doc(db, "pending_maintenance_logs", log.log_id), { status: "rejected", manager_comments: comment, reviewed_at: serverTimestamp() });
      // set assignment back to open for rework
      if (log.assignment_id) {
        await updateDoc(doc(db, "assignments", log.assignment_id), { status: "open" });
      }
      Alert.alert("Rejected and sent back to technician");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error rejecting");
    }
  }

  if (!log) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text>Loading...</Text></View>;

  return (
    <View style={{padding:16}}>
      <Text style={{fontSize:18,fontWeight:"700"}}>Review: {log.equipment_id} / {log.task_id}</Text>
      <Text style={{marginTop:8}}>Technician: {log.technician_name || log.technician_id}</Text>
      <Text style={{marginTop:8}}>Vibration: {log.vibration}</Text>

      {log.images && log.images.length > 0 && <Image source={{uri:log.images[0]}} style={{width:"100%",height:200,marginTop:12}} />}

      <Text style={{marginTop:12,fontWeight:"700"}}>Checklist</Text>
      {log.checklist?.map((c, i) => <View key={i} style={{flexDirection:"row", marginTop:8}}><Text style={{flex:1}}>{c.label || c.task_activity}</Text><Text>{c.checked ? "✔️" : "❌"}</Text></View>)}

      <TextInput placeholder="Manager comments" value={comment} onChangeText={setComment} style={{borderWidth:1, padding:8, marginTop:12}} />

      <View style={{flexDirection:"row",justifyContent:"space-between", marginTop:12}}>
        <Button title="Approve" onPress={approve} />
        <Button title="Reject" color="red" onPress={reject} />
      </View>
    </View>
  );
}
