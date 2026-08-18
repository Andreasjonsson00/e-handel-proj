import { Routes, Route } from "react-router-dom";
import Frontpage from "./pages/Frontpage";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Frontpage />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
