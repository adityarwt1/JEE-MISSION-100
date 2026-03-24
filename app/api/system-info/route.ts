import { NextResponse } from 'next/server';
import si from 'systeminformation';

export async function GET() {
  try {
    const cpu = await si.cpu();
    return NextResponse.json(cpu);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get system info' }, { status: 500 });
  }
}