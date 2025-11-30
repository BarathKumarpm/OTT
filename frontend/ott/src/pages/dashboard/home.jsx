// pages/dashboard/home.jsx
import { useEffect, useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";

export default function DashboardHome() {
  const [userName, setUserName] = useState("Admin");
  
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUserName(storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1));
    }
  }, []);

  return (
    // ✅ No DashboardLayout wrapper - just return the content
    <div className="space-y-10 py-6 lg:mt-0 mt-20">
      
      {/* Main Dashboard Title */}
      <div className="text-2xl font-bold text-center text-slate-600 uppercase">
        <h1>Overtime Worker Pay Management</h1>
      </div>

      {/* Card Displaying User Information (Centered) */}
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* 1. Welcome Card */}
        <Card className="shadow-lg border-t border-indigo-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">
              Welcome Back
            </CardTitle>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              className="h-6 w-6 text-indigo-900"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row items-center text-4xl font-extrabold text-indigo-900 mt-2 gap-x-4">
              {userName} @
              <img
                src="/asom.png"
                alt="Asom Logo"
                className="w-40 h-14 mt-2"
              />
            </div>
            <CardDescription className="text-sm text-slate-900 mt-2">
              You are currently logged in as an Administrator. Access rights are granted.
            </CardDescription>
          </CardContent>
        </Card>
        
        {/* 2. Overtime Rules Card */}
        <Card className="shadow-lg border-t border-indigo-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-indigo-900">
              Overtime Pay Rules
            </CardTitle>
            <CardDescription className="text-gray-600">
              Key regulatory standards for overtime calculation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-800 list-disc pl-5">
              <li>
                The base workday includes 8 hours on weekdays. Overtime starts after these 8 hours.
              </li>
              <li>
                A 1-hour lunch break taken each day is not considered work time and will not be calculated for pay.
              </li>
              <li>
                The maximum overtime considered for pay is 72 hours per month.
              </li>
              <li>
                Any overtime worked above 72 hours in a calendar month is not considered for additional overtime pay.
              </li>
            </ul>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
