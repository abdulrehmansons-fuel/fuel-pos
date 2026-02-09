import { NavLink } from "@/components/ui/navLink";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  User,
  Receipt,
  FileText,
  Banknote,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Package, label: "Stock", href: "/admin/stock" },
  { icon: User, label: "Employers", href: "/admin/employers" },
  { icon: User, label: "Fuel Pumps", href: "/admin/FuelPumps" },
  { icon: BarChart3, label: "Sales", href: "/admin/sales" },
  { icon: Receipt, label: "Expenses", href: "/admin/expenses" },
  { icon: FileText, label: "Reports", href: "/admin/report" },
  { icon: Banknote, label: "Cash Management", href: "/admin/cash-flow" },
];

export const AdminSidebar = () => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent">
            <LayoutDashboard className="h-6 w-6 text-sidebar-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Petrol POS</h1>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-sidebar-foreground/5 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">Need Help?</p>
          <p className="text-xs text-sidebar-foreground/60">Contact support</p>
        </div>
      </div>
    </aside>
  );
};
