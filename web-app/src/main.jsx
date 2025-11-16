import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EquipmentList from "./pages/EquipmentList";
import TaskList from "./pages/TaskList";
import ProtectedRoute from "./components/ProtectedRoute";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/equipment" element={
        <ProtectedRoute><EquipmentList /></ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute><TaskList /></ProtectedRoute>
      } />
    </Routes>
  </BrowserRouter>
);
