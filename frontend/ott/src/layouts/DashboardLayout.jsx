// layouts/DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
