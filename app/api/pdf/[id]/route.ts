import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || !/^[\w-]+$/.test(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }

  const upstream = await fetch(
    `https://drive.usercontent.google.com/download?id=${id}&export=view`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } }
  )

  if (!upstream.ok) {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 })
  }

  const buffer = await upstream.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
