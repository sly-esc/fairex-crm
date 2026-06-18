import { AppSidebar } from '@/components/layout/AppSidebar'
import { TopHeader } from '@/components/layout/TopHeader'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { DataProvider } from '@/components/providers/DataProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-zinc-950 to-zinc-950 pointer-events-none" />
        
        {/* Sidebar - hidden on mobile for now */}
        <div className="hidden md:block h-full z-20">
          <AppSidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0 z-10 overflow-hidden relative">
          <TopHeader />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth relative">
            <DataProvider>
              {children}
            </DataProvider>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
