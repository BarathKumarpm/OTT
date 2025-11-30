"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  UserPlus,
  Clock,
  BarChart2,
  ClipboardList,
  History,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";

// -------------------------
// MENU ITEMS
// -------------------------
const menuItems = [
  {
    title: "Home",
    url: "/dashboard/home",
    icon: Home,
  },
  {
    title: "Add Worker",
    url: "/dashboard/add-worker",
    icon: UserPlus,
  },
  {
    title: "Enter OT",
    url: "/dashboard/enter-ot",
    icon: Clock,
  },
  {
    title: "Summary",
    url: "/dashboard/summary",
    icon: BarChart2,
  },
  {
    title: "Assignment",
    url: "/dashboard/assignment",
    icon: ClipboardList,
  },
  {
    title: "History",
    url: "/dashboard/history",
    icon: History,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); // Redirect to landing page
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  // Sidebar content component (reusable for both desktop and mobile)
  const SidebarNav = ({ onItemClick }) => (
    <>
      <SidebarContent>
        {/* LOGO / TITLE */}
        <SidebarGroup className="h-16 flex items-center p-4">
          <img
            src="/asom.png"
            alt="Asom Logo"
            className="w-60 h-30 object-cover mb-4"
          />
          <span className="text-lg font-bold transition-opacity data-[state=collapsed]:sr-only">
            Overtime Tracker
          </span>
        </SidebarGroup>

        <div className="py-14">
          {/* GROUP: DASHBOARD */}
          <SidebarGroup>
            <SidebarGroupLabel className="data-[state=collapsed]:hidden text-gray-400 uppercase text-xs font-semibold px-4 pt-2 pb-1">
              Dashboard
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = currentPath === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-indigo-900 text-white ${
                          isActive ? "bg-indigo-900" : ""
                        }`}
                      >
                        <Link to={item.url} onClick={onItemClick}>
                          <item.icon className="h-4 w-4" />
                          <span className="data-[state=collapsed]:sr-only">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      {/* LOGOUT BUTTON FIXED AT BOTTOM */}
      <SidebarFooter className="p-8">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  onItemClick?.();
                  handleLogout();
                }}
                className="hover:bg-rose-700 bg-rose-600 text-white w-full justify-start"
              >
                <LogOut className="h-8 w-4" />
                <span className="data-[state=collapsed]:sr-only">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-400 text-white h-14 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="/asom.png"
            alt="Asom Logo"
            className="h-8 object-contain"
          />
          <span className="font-semibold text-sm">Overtime Tracker</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-400 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-slate-400 z-40 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white transition ${
                      isActive
                        ? "bg-indigo-900"
                        : "hover:bg-indigo-900/50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Logout Button */}
          <div className="p-4 border-t border-slate-400">
            <button
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex bg-slate-400 text-white border-r border-slate-400">
        <SidebarNav />
      </Sidebar>

      {/* Mobile Content Padding */}
      <div className="lg:hidden h-14" />
    </>
  );
}
