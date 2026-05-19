import { createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function computeSessionToken(): string {
  return createHmac('sha256', process.env.ANALYTICS_SESSION_SECRET!)
    .update('analytics-auth')
    .digest('hex')
}

export async function POST(req: Request) {
  const { password } = await req.json()

  if (!password || password !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const token = computeSessionToken()
  const cookieStore = await cookies()

  cookieStore.set('analytics_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('analytics_session')
  return NextResponse.json({ success: true })
}
