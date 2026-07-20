import OnboardingWizard from "./OnboardingWizard";
import { Suspense } from "react";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Agregar Nueva Empresa</h1>
        <p className="text-zinc-400 mt-2">Configura una nueva empresa de inicio a fin.</p>
      </div>

      <Suspense fallback={<div className="text-zinc-400">Cargando wizard...</div>}>
        <OnboardingWizard />
      </Suspense>
    </div>
  );
}
