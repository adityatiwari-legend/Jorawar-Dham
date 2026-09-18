"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Calendar,
  FileText,
  Image as ImageIcon,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  User,
  Ticket,
  Clock,
  QrCode,
  CreditCard,
  Heart,
  BarChart3,
  Users,
  Sparkles,
  UserCheck,
} from "lucide-react";

interface AdminProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  roles: string[];
  isSuperAdmin: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  // If on login page, render without admin chrome
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setAdmin(data.admin);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/services", label: "Services & Darshan", icon: Sparkles },
    { href: "/admin/slots", label: "Slots & Capacity", icon: Clock },
    { href: "/admin/bookings", label: "Bookings & Passes", icon: Ticket },
    { href: "/admin/invoices", label: "Invoices & Receipts", icon: FileText },
    { href: "/admin/payments", label: "Payments Ledger", icon: CreditCard },
    { href: "/admin/donations", label: "Donations & Causes", icon: Heart },
    { href: "/admin/devotees", label: "Devotees Directory", icon: UserCheck },
    { href: "/admin/scanner", label: "Entrance Scanner", icon: QrCode },
    { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { href: "/admin/users", label: "Admin Users & RBAC", icon: Users },
    { href: "/admin/notices", label: "Notices & Alerts", icon: Bell },
    { href: "/admin/events", label: "Events & Festivals", icon: Calendar },
    { href: "/admin/content/pages", label: "Dynamic Pages", icon: FileText },
    { href: "/admin/gallery", label: "Sacred Gallery", icon: ImageIcon },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:flex-row text-stone-900">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <img
            src="/branding/jorawar-dham-icon.png"
            alt="सिद्ध श्री जोरावर धाम"
            className="w-8 h-8 rounded-full object-contain border border-gold-400/40 shadow-sm"
          />
          <div>
            <span className="font-bold text-sm tracking-wide block leading-none font-serif">प्रशासन पोर्टल</span>
            <span className="text-[10px] text-stone-400">Jorawar Dham CMS</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } border-r border-stone-800`}
      >
        <div className="p-6 space-y-8">
          {/* Logo & Brand */}
          <div className="space-y-2">
            <Link href="/admin/dashboard" className="block">
              <img
                src="/branding/jorawar-dham-logo.png"
                alt="सिद्ध श्री जोरावर धाम सेवा समिति"
                className="w-full h-auto max-h-12 object-contain rounded-lg border border-gold-500/30 bg-blue-950/50 p-1"
              />
            </Link>
            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 font-mono">
              <span>प्रशासन पोर्टल</span>
              <span className="text-gold-400 font-semibold">CMS v2.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-saffron-600 text-white shadow-sm"
                      : "text-stone-400 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Footer Actions */}
        <div className="p-4 border-t border-stone-800 space-y-3">
          {admin && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-saffron-400">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-white truncate">
                  {admin.firstName} {admin.lastName || ""}
                </span>
                <span className="block text-[10px] text-stone-400 truncate">
                  {admin.roles.join(", ")}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2">
            <Link
              href="/hi"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-gold-400 transition-colors py-1.5 px-2 rounded-lg hover:bg-stone-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors py-1.5 px-2 rounded-lg hover:bg-red-950/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
