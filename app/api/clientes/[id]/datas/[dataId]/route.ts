import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; dataId: string }> }
) {
  const { dataId } = await params

  const { error } = await supabase
    .from('cliente_datas')
    .delete()
    .eq('id', dataId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
