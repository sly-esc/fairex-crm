import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Link from "next/link";
import { Building2, LayoutDashboard, PlusCircle, Settings, LogOut } from "lucide-react";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar si es super admin consultando la tabla profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect("/dashboard");
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-950 text-foreground">
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
        
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-64 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl z-20">
          <div className="p-6">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              FAIREX <span className="text-white text-sm font-normal">Super Admin</span>
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/superadmin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/superadmin/companies" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <Building2 className="w-4 h-4" />
              Empresas
            </Link>
            <Link href="/superadmin/onboarding" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-colors">
              <PlusCircle className="w-4 h-4" />
              Crear Empresa
            </Link>
            <Link href="/superadmin/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <Settings className="w-4 h-4" />
              Configuración
            </Link>
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
              Salir a Dashboard
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0 z-10 overflow-hidden relative">
          <header className="md:hidden flex items-center p-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
            <h1 className="text-lg font-bold text-white">FAIREX Super Admin</h1>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth relative">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
