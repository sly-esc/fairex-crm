import { Settings } from "lucide-react";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-zinc-400" />
          Configuración Global
        </h1>
        <p className="text-zinc-400 mt-2">Ajustes generales del sistema y la plataforma.</p>
      </div>

      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-8 text-center max-w-2xl backdrop-blur-sm">
        <h2 className="text-xl font-medium text-white mb-2">Próximamente</h2>
        <p className="text-zinc-400">
          Este módulo se configurará más adelante. Aquí podrás gestionar variables de entorno globales, límites por defecto para los planes y otras configuraciones a nivel sistema.
        </p>
      </div>
    </div>
  );
}
