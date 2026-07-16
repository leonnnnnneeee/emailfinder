import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const REMIND_DAYS = 4
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  // Security check
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== (process.env.CRON_SECRET || 'coincu-cron-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const cutoff = new Date(now - REMIND_DAYS * DAY_MS).toISOString()

  // Find emails needing R1
  const { data: needR1 } = await supabase.from('emails')
    .select('id').eq('status', 'sent').is('remind1_sent_at', null).lt('sent_at', cutoff)
  
  // Find emails needing R2
  const { data: needR2 } = await supabase.from('emails')
    .select('id').eq('status', 'sent').not('remind1_sent_at', 'is', null).is('remind2_sent_at', null).lt('remind1_sent_at', cutoff)
  
  // Find emails needing R3
  const { data: needR3 } = await supabase.from('emails')
    .select('id').eq('status', 'sent').not('remind2_sent_at', 'is', null).is('remind3_sent_at', null).lt('remind2_sent_at', cutoff)

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://my-finder-email-v2bh.vercel.app'
  let sent = 0, failed = 0

  for (const [emails, num] of [[needR1||[], 1], [needR2||[], 2], [needR3||[], 3]] as [any[], number][]) {
    for (const e of emails) {
      try {
        const r = await fetch(`${APP_URL}/api/remind`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: e.id, remindNum: num })
        })
        const d = await r.json()
        if (d.ok) sent++; else failed++
      } catch { failed++ }
    }
  }

  return NextResponse.json({ 
    ok: true, sent, failed,
    summary: { needR1: needR1?.length||0, needR2: needR2?.length||0, needR3: needR3?.length||0 }
  })
}
