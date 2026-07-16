import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('email_templates').select('*').order('created_at')
  return NextResponse.json({ templates: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('email_templates').insert({
    name: body.name, subject: body.subject, body: body.body, owner_id: body.owner_id || null
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabase.from('email_templates').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
