import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Register() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!username || !password) {
      alert("Username and password required!");
      return;
    }

    try {
      await API.post("/users/register", {
        username,
        password,
      });

      alert("Registered successfully!");
      nav("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="h-screen w-full bg-[url('/ship.png')] bg-cover bg-center">
      <div className="min-h-screen flex items-center justify-center backdrop-blur-sm">
        <div className="lg:w-full w-90% max-w-md bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-indigo-800">
            REGISTER
          </h2>

          <div className="mt-6">
            <label className="text-gray-600">Username</label>
            <input
              type="text"
              placeholder="Create your username"
              className="w-full mt-2 p-3 border rounded-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label className="text-gray-600 mt-4 block">Password</label>
            <input
              type="password"
              placeholder="Create your password"
              className="w-full mt-2 p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            className="w-full mt-6 py-3 bg-black text-white"
            onClick={handleSubmit}
          >
            SIGN UP
          </Button>

          <p className="text-center mt-4">
            Already have an account?
            <Link to="/login" className="text-indigo-800 ml-2">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
