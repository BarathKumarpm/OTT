import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


export default function Navbar() {
return (
    <nav className="w-full flex items-center justify-between px-10 py-4 shadow-sm bg-white">
        <Link to="/" className="text-2xl font-bold text-indigo-800">OTT</Link>
        <div className="flex items-center gap-6">
            <Link to="/login" className="text-gray-700 hover:text-blue-700">Login</Link>
            <Button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-600">
                <Link to="/register">Sign Up</Link>
            </Button>
        </div>
    </nav>
);
}