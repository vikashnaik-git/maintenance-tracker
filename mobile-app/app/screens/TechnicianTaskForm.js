// app/screens/TechnicianTaskForm.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig"; // storage must be exported

import { v4 as uuidv4 } from 'uuid';

function splitChecklistFields(taskDoc) {
  // try several fields
  const fields = [];
  if (taskDoc.task_activity) fields.push(taskDoc.task_activity);
  if (taskDoc.component_focus) fields.push(taskDoc.component_focus);
  if (taskDoc.description_check) fields.push(taskDoc.description_check);
  const joined = fields.join("\n\n");
  // split by newlines or semicolon or double pipe
  const parts = joined.split(/\r?\n|;|\|\|/).map(s => s.trim()).filter(Boolean);
  return parts;
}

export default function TechnicianTaskForm({ route, navigation }) {
  const { assignmentId, taskId, equipmentId, empId } = route.params;
  const [taskDoc, setTaskDoc] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [vibration, setVibration] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [gps, setGps] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=> {
    loadTask();
    requestPermissions();
  },[]);

  const loadTask = async () => {
    const snap = await getDoc(doc(db, "maintenance_tasks", taskId));
    if (snap.exists()) {
      const data = snap.data();
      setTaskDoc(data);
      const items = splitChecklistFields(data);
      const arr = items.map(it => ({ label: it, checked: false }));
      setChecklist(arr);
    } else {
      Alert.alert("Task not found");
    }
  };

  const requestPermissions = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await Location.requestForegroundPermissionsAsync();
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality:0.6, allowsEditing:true });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
    }
  };

  const captureGps = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");
    const loc = await Location.getCurrentPositionAsync({});
    setGps({ lat: loc.coords.latitude, lon: loc.coords.longitude });
  };

  const toggle = (i)=>{
    const c = [...checklist];
    c[i].checked = !c[i].checked;
    setChecklist(c);
  };

  async function uploadImageToStorage(uri) {
    if (!uri) return null;
    // convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    const id = uuidv4();
    const storageRef = ref(storage, `maintenance_images/${equipmentId}/${id}.jpg`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return url;
  }

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const logId = uuidv4();
      let imageUrl = null;
      if (imageUri) imageUrl = await uploadImageToStorage(imageUri);

      const payload = {
        log_id: logId,
        assignment_id: assignmentId,
        task_id: taskId,
        equipment_id: equipmentId,
        technician_id: empId,
        technician_name: empId,
        submitted_at: serverTimestamp(),
        checklist: checklist,
        vibration: vibration ? parseFloat(vibration) : null,
        images: imageUrl ? [imageUrl] : [],
        gps: gps || null,
        status: "Submitted",
      };

      // save pending doc
      await setDoc(doc(db, "pending_maintenance_logs", logId), payload);

      // update assignment status
      await updateDoc(doc(db, "assignments", assignmentId), { status: "submitted", last_submitted_at: serverTimestamp() });

      Alert.alert("Submitted", "Your submission is sent for manager review");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Submit error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!taskDoc) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text>Loading task...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>{taskDoc.task_activity || taskDoc.task_id || taskId}</Text>

      {checklist.map((c, i) => (
        <TouchableOpacity key={i} style={styles.row} onPress={()=>toggle(i)}>
          <View style={[styles.checkbox, c.checked && styles.checked]} />
          <Text style={styles.label}>{c.label}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.subLabel}>Vibration (mm/s)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={vibration} onChangeText={setVibration} />

      <TouchableOpacity style={styles.btn} onPress={pickImage}><Text style={styles.btnText}>Take Photo</Text></TouchableOpacity>
      {imageUri && <Image source={{uri:imageUri}} style={styles.preview} />}

      <TouchableOpacity style={styles.btn} onPress={captureGps}><Text style={styles.btnText}>Capture GPS</Text></TouchableOpacity>
      {gps && <Text>GPS: {gps.lat}, {gps.lon}</Text>}

      <TouchableOpacity style={[styles.btn, {backgroundColor:"#007bff"}]} onPress={handleSubmit}>
        <Text style={[styles.btnText,{color:"#fff"}]}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:"#fff"},
  heading:{fontSize:20,fontWeight:"700",marginBottom:12},
  row:{flexDirection:"row",alignItems:"center",marginBottom:10},
  checkbox:{width:22,height:22,borderWidth:1,marginRight:12,borderRadius:4},
  checked:{backgroundColor:"#4CAF50"},
  label:{flex:1},
  subLabel:{marginTop:12,fontWeight:"600"},
  input:{borderWidth:1,padding:8,marginTop:8,borderRadius:6},
  btn:{padding:12,backgroundColor:"#eee",marginTop:12,borderRadius:8,alignItems:"center"},
  btnText:{fontSize:16},
  preview:{width:"100%",height:200,marginTop:8,borderRadius:8}
});
