import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyList from "./pages/MyList";
import Profile from "./pages/Profile";
import Genre from "./pages/Genre";
import Search from "./pages/Search";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/movie/:id" element={
        <div className="bg-[#0a0a0a] min-h-screen">
          <Navbar />
          <MovieDetail />
        </div>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/mylist" element={
        <ProtectedRoute>
          <div className="bg-[#0a0a0a] min-h-screen">
            <Navbar />
            <MyList />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/genre/:slug" element={<Genre />} />
    </Routes>
  );
}

export default App;