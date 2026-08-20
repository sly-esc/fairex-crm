import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // /api/n8n/* endpoints usan autenticación propia mediante x-n8n-secret.
  // n8n no tiene cookie de sesión de Supabase — no debe ser redirigido a /login.
  if (
    request.nextUrl.pathname === '/api/n8n/context' ||
    request.nextUrl.pathname === '/api/n8n/inventory-search' ||
    request.nextUrl.pathname === '/api/n8n/payment-info'
  ) {
    return NextResponse.next();
  }

  // Desactivar middleware temporalmente si no hay variables de entorno (Modo UI Testing)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
