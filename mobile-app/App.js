import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import Screens
import LoginScreen from "./screens/LoginScreen";

// Technician Screens
import TechnicianHome from "./screens/TechnicianHome";
import TechnicianTaskForm from "./screens/TechnicianTaskForm";

// Manager Screens
import ManagerHome from "./screens/ManagerHome";
import ManagerTaskList from "./screens/ManagerTaskList";
import ManagerTaskReview from "./screens/ManagerTaskReview";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">

        {/* LOGIN */}
        <Stack.Screen 
          name="LoginScreen" 
          component={LoginScreen} 
          options={{ title: "Login" }} 
        />

        {/* TECHNICIAN ROUTES */}
        <Stack.Screen 
          name="TechnicianHome" 
          component={TechnicianHome} 
          options={{ title: "Technician Dashboard" }} 
        />
        <Stack.Screen 
          name="TechnicianTaskForm" 
          component={TechnicianTaskForm} 
          options={{ title: "Task Update" }} 
        />

        {/* MANAGER ROUTES */}
        <Stack.Screen 
          name="ManagerHome" 
          component={ManagerHome} 
          options={{ title: "Manager Dashboard" }} 
        />
        <Stack.Screen 
          name="ManagerTaskList" 
          component={ManagerTaskList} 
          options={{ title: "Pump Tasks" }} 
        />
        <Stack.Screen 
          name="ManagerTaskReview" 
          component={ManagerTaskReview} 
          options={{ title: "Review Task" }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
