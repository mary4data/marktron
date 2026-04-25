import { NextResponse } from 'next/server'
import { seed } from '@/lib/seed'

export async function GET() {
  const result = await seed()
  return NextResponse.json(result)
}
