import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Username and password required!");
      return;
    }

    try {
      const res = await API.post("/users/login", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);

      alert("Logged in successfully!");
      nav("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen w-full bg-[url('/ship.png')] bg-cover bg-center">
      <div className="min-h-screen flex items-center justify-center backdrop-blur-sm">
        <div className="lg:w-full w-90% max-w-md bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-indigo-800">
            LOGIN
          </h2>

          <div className="mt-6">
            <label className="text-gray-600">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full mt-2 p-3 border rounded-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label className="text-gray-600 mt-4 block">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mt-2 p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            className="w-full mt-6 py-3 bg-black text-white"
            onClick={handleLogin}
          >
            SIGN IN
          </Button>

          <p className="text-center mt-4">
            Don't have an account?
            <Link to="/register" className="text-indigo-800 ml-2">
              Join Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
