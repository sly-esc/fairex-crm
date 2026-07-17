import OnboardingWizard from "./OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Nuevo Tenant (Onboarding)</h1>
        <p className="text-zinc-400 mt-2">Configura una nueva empresa de inicio a fin en 6 pasos.</p>
      </div>

      <OnboardingWizard />
    </div>
  );
}
