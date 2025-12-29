'use client';

import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/POSSidebar";
import { TopBar } from "@/components/admin/POSTopbar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Admin Dashboard" showUserMenu />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
