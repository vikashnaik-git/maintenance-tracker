import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("Dashboard");
    } catch (e) {
      alert("Login failed: " + e.message);
    }
  };

  return (
    <View style={{ padding: 30 }}>
      <Text style={{ fontSize: 24 }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />

      <Button title="Login" onPress={login} />
    </View>
  );
}
