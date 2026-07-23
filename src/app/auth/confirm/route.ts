import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getSecureOrigin() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  return 'https://fairexcrm.online'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const origin = getSecureOrigin()

  if (!token_hash || type !== 'email') {
    return NextResponse.redirect(new URL('/login?error=invalid_or_expired_link', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: 'email',
  })

  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_or_expired_link', origin))
  }

  return NextResponse.redirect(new URL('/set-password', origin))
}
