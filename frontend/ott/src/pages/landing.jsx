import Navbar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div>
      <Navbar />

      <section className="flex flex-col items-center text-center mt-20 px-6">
        <div className="justify-center items-center text-center">
          <img
            src="/asom.png"
            alt="Asom Logo"
            className="w-full h-full object-cover mb-20"
          />

          <h1 className="text-5xl font-bold text-indigo-800">
            Over Time Tracker
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl">
            Manage, track and analyze overtime with real-time insights.
          </p>

          <Link to="/login">
            <Button className="mt-6 px-12 py-6 text-lg bg-neutral-800 text-white">
              Login 
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
