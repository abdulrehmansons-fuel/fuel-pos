'use client';

import { ReactNode, useState, useEffect } from "react";
import { Topbar } from "@/components/employer/EmployerTopbar";
import { usePathname, useParams, useRouter } from "next/navigation";
import { getEmployerDetails } from "@/app/actions/getEmployer";

interface EmployeeLayoutProps {
  children: ReactNode;
}

export const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {
  const pathname = usePathname();
  const params = useParams();

  // Extract pump and employer IDs from route params
  const pumpId = params?.pump as string || "pump1";
  const employerId = params?.id as string || "emp1";

  // Determine active page based on pathname
  const activePage = pathname?.includes('/createSales') || pathname?.includes('/create') || pathname?.includes('/checkout')
    ? 'create' as const
    : 'sales' as const;

  // State for dynamic data
  const [pumpName, setPumpName] = useState("Loading...");
  const [employerName, setEmployerName] = useState("Loading...");

  useEffect(() => {
    if (pumpId) {
      setPumpName(decodeURIComponent(pumpId));
    }

    const fetchEmployer = async () => {
      if (employerId) {
        const details = await getEmployerDetails(employerId);
        if (details) {
          setEmployerName(details.fullName);
        }
      }
    };
    fetchEmployer();
  }, [pumpId, employerId]);

  const router = useRouter();

  const handleLogout = () => {
    // Perform any cleanup here if needed (e.g. clearing cookies/localstorage)
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Topbar
        pumpName={pumpName}
        employerName={employerName}
        activePage={activePage}
        pumpId={pumpId}
        employerId={employerId}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
};
