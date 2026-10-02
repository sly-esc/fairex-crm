import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-950 min-h-screen text-white font-sans">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">FAIREX Business OS</h1>
        <p className="text-lg text-zinc-400 max-w-md">
          Sistema Operativo Comercial B2B con Inteligencia Artificial.
        </p>
        <Link 
          href="/dashboard" 
          className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Ingresar al Dashboard
        </Link>
      </main>
    </div>
  );
}
