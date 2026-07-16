import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('email_blacklist').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ blacklist: data || [] })
}
export async function POST(req: NextRequest) {
  const { domain, email, reason } = await req.json()
  const { error } = await supabase.from('email_blacklist').insert({ domain: domain?.toLowerCase(), email: email?.toLowerCase(), reason: reason || 'not interested' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabase.from('email_blacklist').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
