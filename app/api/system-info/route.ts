import { NextRequest, NextResponse } from 'next/server';
import si from 'systeminformation';
import type { DeviceInfoInterface , } from '@/interfaces/deviceinfoInterface';

export const runtime = 'nodejs';

const safeCall = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    console.warn('systeminformation call failed', error);
    return undefined;
  }
};

export async function GET(req: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const url = new URL(req.url);
    const isValidOrigin = process.env.ALLOWED_ORIGIN === url.origin;

    if (isProduction && !isValidOrigin) {
      return NextResponse.json(
        {
          error: {
            message: 'Operation not allowed externally!',
            status: 401,
            detail: 'This request is not allowed from external origin/source',
          },
        },
        { status: 401 }
      );
    }

    const audio = await safeCall(() => si.audio());
    const baseboard = await safeCall(() => si.baseboard());
    const battery = await safeCall(() => si.battery());
    const bios = await safeCall(() => si.bios());
    
    const cpu = await safeCall(() => si.cpu());
    const diskLayout = await safeCall(() => si.diskLayout());
    const graphics = await safeCall(() => si.graphics());
    const memLayout = await safeCall(() => si.memLayout());
    const os = await safeCall(() => si.osInfo());
    const system = await safeCall(() => si.system());
    const time = await safeCall(() => si.time());

    const payload: Partial<DeviceInfoInterface> = {
      audio,
      baseboard ,
      battery,
      bios,
      cpu,
      diskLayout,
      graphics,
      memLayout,
      os,
      system,
      time,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('GET /api/system-info failed:', error);
    return NextResponse.json({ error: 'Failed to get system info' }, { status: 500 });
  }
}
