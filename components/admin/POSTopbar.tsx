
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, LogOut, AlertTriangle, Package, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/hooks/use-auth';
import { AdminSidebar } from "@/components/admin/POSSidebar";

interface StockAlert {
  category: string;
  totalQuantity: number;
}

interface TopBarProps {
  title: string;
  showUserMenu?: boolean;
}

export const TopBar = ({ title, showUserMenu = false }: TopBarProps) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch("/api/stocks");
        const stocks = await res.json();

        if (Array.isArray(stocks)) {
          // Aggregate by fuelType AND pump
          const aggregation: Record<string, number> = {};
          stocks.forEach((s: { fuelType?: string; quantity?: string | number; pump?: string }) => {
            const fuel = s.fuelType || "Other";
            const pump = s.pump || "Main";
            const key = `${fuel} (${pump})`;
            aggregation[key] = (aggregation[key] || 0) + (Number(s.quantity) || 0);
          });

          // Filter categories below 100L
          const alerts = Object.entries(aggregation)
            .filter(([, total]) => total < 100)
            .map(([category, totalQuantity]) => ({ category, totalQuantity }));

          setStockAlerts(alerts);
        }
      } catch (error) {
        console.error("Error fetching stocks for notifications:", error);
      }
    };

    fetchStocks();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchStocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-3 md:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Mobile Sidebar Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          <h2 className="text-lg md:text-xl font-semibold text-foreground">{title}</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 rounded-xl border-input pl-10"
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl">
                <Bell className="h-5 w-5" />
                {stockAlerts.length > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 p-0 text-xs flex items-center justify-center border-2 border-white">
                    {stockAlerts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px] rounded-xl p-2">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {stockAlerts.length > 0 && (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                    {stockAlerts.length} Low Stock Alert{stockAlerts.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stockAlerts.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {stockAlerts.map((alert, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      className="cursor-pointer p-3 rounded-lg focus:bg-red-50 group mb-1"
                      onClick={() => router.push("/admin/stock")}
                    >
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 group-focus:bg-red-200">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-foreground">
                            Low Stock: {alert.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total volume is only <span className="text-red-600 font-bold">{alert.totalQuantity.toFixed(1)}L</span>. Stock for this pump is below the <span className="font-medium">100L</span> threshold.
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              {stockAlerts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs text-primary font-medium cursor-pointer hover:bg-primary/5 py-2"
                    onClick={() => router.push("/admin/stock")}
                  >
                    Manage Inventory
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {showUserMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer"
                  onClick={() => router.push("/admin/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

