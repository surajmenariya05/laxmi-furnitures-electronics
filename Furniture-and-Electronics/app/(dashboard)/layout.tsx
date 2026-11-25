import NextAuthSessionProvider from "@/components/dashboard/providers/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KeepAlive from "@/components/dashboard/KeepAlive";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DepartmentProvider } from "@/components/dashboard/department/DepartmentContext";
import { ToastProvider } from "@/components/dashboard/providers/ToastProvider";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isOwner = session.user.role === "owner";
  const welcomeName =
    session.user.role === "owner"
      ? "Welcome Suraj Menariya"
      : `Welcome ${session.user.name}`;

  return (
    <NextAuthSessionProvider>
      <DepartmentProvider>
        <ToastProvider>
          <KeepAlive />
          <div className="min-h-screen relative flex overflow-x-clip">
            {/* Fixed Dashboard Background Image with Frosted Readability Overlay */}
            <DashboardBackground src="/Minimalist White Hexagon Honeycomb.png" overlayOpacity={0.25} />

            <DashboardShell isOwner={isOwner} welcomeName={welcomeName}>
              {children}
            </DashboardShell>
          </div>
        </ToastProvider>
      </DepartmentProvider>
    </NextAuthSessionProvider>
  );
}
