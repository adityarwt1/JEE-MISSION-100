"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeviceInfoInterface } from "@/interfaces/deviceinfoInterface";

const apiUrl = "/api/system-info";

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const DataRow = ({ label, value }: { label: string; value: string | number | boolean | undefined | null }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-1.5 last:border-0">
      <span className="text-white/50 font-medium text-[11px] uppercase tracking-wider">{label}</span>
      <span className="text-white text-right font-mono text-[12px]">{String(value)}</span>
    </div>
  );
};

export default function App() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoInterface | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(apiUrl);
        const json: DeviceInfoInterface = await res.json();
        setDeviceInfo(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const totalRam = useMemo(() => deviceInfo?.memLayout?.reduce((sum, item) => sum + (item.size ?? 0), 0), [deviceInfo]);
  const totalStorage = useMemo(() => deviceInfo?.diskLayout?.reduce((sum, item) => sum + (item.size ?? 0), 0), [deviceInfo]);

  // FIXED: Consistent card height and theme matching
  const cardStyle = "h-[480px] flex flex-col p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg text-white";
  const scrollArea = "flex-1 overflow-y-auto pr-2 custom-scroll";

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-zinc-900 to-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6 p-10">
        {[...Array(6)].map((_, i) => <div key={i} className={`${cardStyle} animate-pulse bg-white/5`} />)}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-zinc-900 to-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10 font-sans">
      
      {/* Global CSS for the scrollbar to match the theme */}
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>

      {/* 1. CPU Card */}
      <div className={cardStyle}>
        <h2 className="text-2xl font-bold tracking-tight border-b border-white/20 pb-2 mb-4">CPU</h2>
        <div className={scrollArea}>
          <DataRow label="Brand" value={deviceInfo?.cpu?.brand} />
          <DataRow label="Manufacturer" value={deviceInfo?.cpu?.manufacturer} />
          <DataRow label="Cores" value={deviceInfo?.cpu?.cores} />
          <DataRow label="Logical" value={deviceInfo?.cpu?.physicalCores} />
          <DataRow label="Speed" value={deviceInfo?.cpu?.speed ? `${deviceInfo.cpu.speed} GHz` : undefined} />
          <div className="mt-4 p-3 bg-black/10 rounded text-[10px] opacity-40 italic break-all">
            {deviceInfo?.cpu?.flags}
          </div>
        </div>
      </div>

      {/* 2. GPU Card */}
      <div className={cardStyle}>
        <h2 className="text-2xl font-bold tracking-tight border-b border-white/20 pb-2 mb-4">GPU & Display</h2>
        <div className={scrollArea}>
          {deviceInfo?.graphics?.controllers?.map((gpu, i) => (
            <div key={i} className="mb-4 space-y-1 bg-black/20 p-3 rounded-xl border border-white/5">
              <DataRow label="Model" value={gpu.model} />
              <DataRow label="Temp" value={gpu.temperatureGpu ? `${gpu.temperatureGpu}°C` : 'N/A'} />
              <DataRow label="Power" value={gpu.powerDraw ? `${gpu.powerDraw}W` : undefined} />
              <DataRow label="VRAM" value={formatBytes(gpu.memoryTotal)} />
            </div>
          ))}
          {deviceInfo?.graphics?.displays?.map((disp, i) => (
            <div key={i} className="mt-2 pt-2 border-t border-white/10">
              <DataRow label={`Display ${i+1}`} value={`${disp.currentResX}x${disp.currentResY} @ ${disp.currentRefreshRate}Hz`} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Storage Card */}
      <div className={cardStyle}>
        <div className="flex justify-between items-end border-b border-white/20 pb-2 mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Storage</h2>
          <span className="text-xs font-mono text-emerald-400">{formatBytes(totalStorage)}</span>
        </div>
        <div className={scrollArea}>
          {deviceInfo?.diskLayout?.map((disk, i) => (
            <div key={i} className="mb-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <DataRow label="Name" value={disk.name} />
              <DataRow label="Type" value={disk.type} />
              <DataRow label="Size" value={formatBytes(disk.size)} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. RAM Card */}
      <div className={cardStyle}>
        <div className="flex justify-between items-end border-b border-white/20 pb-2 mb-4">
          <h2 className="text-2xl font-bold tracking-tight">RAM</h2>
          <span className="text-xs font-mono text-cyan-400">{formatBytes(totalRam)}</span>
        </div>
        <div className={scrollArea}>
          {deviceInfo?.memLayout?.map((mem, i) => (
            <div key={i} className="mb-2 p-3 bg-white/5 rounded-xl">
              <DataRow label={`Slot ${i+1}`} value={`${mem.type} ${mem.clockSpeed}MHz`} />
              <DataRow label="Manufacturer" value={mem.manufacturer} />
              <DataRow label="Size" value={formatBytes(mem.size)} />
            </div>
          ))}
        </div>
      </div>

      {/* 5. System & Bios Card - FIXED SCROLL & MATCHING THEME */}
      <div className={cardStyle}>
        <h2 className="text-2xl font-bold tracking-tight border-b border-white/20 pb-2 mb-4">System & Bios</h2>
        <div className={scrollArea}>
          <section className="mb-6">
            <h3 className="text-white/30 uppercase text-[10px] font-bold mb-2">OS & Host</h3>
            <DataRow label="Distro" value={deviceInfo?.os?.distro} />
            <DataRow label="Hostname" value={deviceInfo?.os?.hostname} />
          </section>
          <section className="mb-6">
            <h3 className="text-white/30 uppercase text-[10px] font-bold mb-2">Motherboard</h3>
            <DataRow label="Model" value={deviceInfo?.baseboard?.model} />
            <DataRow label="BIOS Ver" value={deviceInfo?.bios?.version} />
          </section>
          <section className="mb-6">
            <h3 className="text-white/30 uppercase text-[10px] font-bold mb-2">Battery</h3>
            <DataRow label="Status" value={deviceInfo?.battery?.isCharging ? "Charging" : "Discharging"} />
            <DataRow label="Percent" value={deviceInfo?.battery?.percent ? `${deviceInfo.battery.percent}%` : "N/A"} />
          </section>
          <section>
            <h3 className="text-white/30 uppercase text-[10px] font-bold mb-2">Audio</h3>
            {deviceInfo?.audio?.map((a, i) => (
              <DataRow key={i} label={`Audio ${i+1}`} value={a.name} />
            ))}
          </section>
        </div>
      </div>

      {/* 6. Uptime Card */}
      <div className={cardStyle}>
        <h2 className="text-2xl font-bold tracking-tight border-b border-white/20 pb-2 mb-4">Uptime</h2>
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-md">
            {deviceInfo?.time?.uptime ? `${Math.floor(deviceInfo.time.uptime / 3600)}h` : "0h"}
          </div>
          <div className="text-white/40 text-lg font-mono">
            {deviceInfo?.time?.uptime ? `${Math.floor((deviceInfo.time.uptime % 3600) / 60)}m ${deviceInfo.time.uptime % 60}s` : "0m 0s"}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-white/10">
          <DataRow label="Local Time" value={deviceInfo?.time?.current ? new Date(deviceInfo.time.current * 1000).toLocaleTimeString() : undefined} />
        </div>
      </div>

    </div>
  );
}