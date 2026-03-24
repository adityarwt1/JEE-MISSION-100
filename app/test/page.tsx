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

export default function App() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: DeviceInfoInterface = await res.json();
        setDeviceInfo(json);
      } catch (err) {
        setError(`Failed to load info: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  const totalRam = useMemo(() => {
    if (!deviceInfo?.memLayout?.length) return undefined;
    const total = deviceInfo.memLayout.reduce((sum, item) => sum + (item.size ?? 0), 0);
    return total;
  }, [deviceInfo]);

  const totalStorage = useMemo(() => {
    if (!deviceInfo?.diskLayout?.length) return undefined;
    const total = deviceInfo.diskLayout.reduce((sum, item) => sum + (item.size ?? 0), 0);
    return total;
  }, [deviceInfo]);

  const firstGpu = deviceInfo?.graphics?.controllers?.[0];

  const cardStyle = "col-span-1 p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg text-white";

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-zinc-900 to-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`${cardStyle} animate-pulse bg-slate-600`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-zinc-900 to-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
        <div className={`${cardStyle} text-red-400`}>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-zinc-900 to-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
      {/* CPU Card */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">CPU</h2>
        {deviceInfo?.cpu && (
          <ul className="space-y-1 text-sm">
            {deviceInfo.cpu.brand && <li>Brand: {deviceInfo.cpu.brand}</li>}
            {deviceInfo.cpu.cores && <li>Cores: {deviceInfo.cpu.cores}</li>}
            {deviceInfo.cpu.physicalCores && <li>Physical Cores: {deviceInfo.cpu.physicalCores}</li>}
            {deviceInfo.cpu.performanceCores && <li>Performance Cores: {deviceInfo.cpu.performanceCores}</li>}
            {deviceInfo.cpu.speed && <li>Speed: {deviceInfo.cpu.speed} GHz</li>}
            {deviceInfo.cpu.manufacturer && <li>Manufacturer: {deviceInfo.cpu.manufacturer}</li>}
            {deviceInfo.cpu.family && <li>Family: {deviceInfo.cpu.family}</li>}
            {deviceInfo.cpu.model && <li>Model: {deviceInfo.cpu.model}</li>}
            {deviceInfo.cpu.flags && <li>Flags: {deviceInfo.cpu.flags}</li>}
          </ul>
        )}
      </div>

      {/* GPU Card */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">GPU</h2>
        {firstGpu && (
          <ul className="space-y-1 text-sm">
            {firstGpu.name && <li>Name: {firstGpu.name}</li>}
            {firstGpu.vendor && <li>Vendor: {firstGpu.vendor}</li>}
            {firstGpu.model && <li>Model: {firstGpu.model}</li>}
            {firstGpu.bus && <li>Bus: {firstGpu.bus}</li>}
            {firstGpu.clockCore && <li>Core Clock: {firstGpu.clockCore} MHz</li>}
            {firstGpu.clockMemory && <li>Memory Clock: {firstGpu.clockMemory} MHz</li>}
            {firstGpu.memoryTotal && <li>Memory Total: {formatBytes(firstGpu.memoryTotal)}</li>}
            {firstGpu.memoryFree && <li>Memory Free: {formatBytes(firstGpu.memoryFree)}</li>}
            {firstGpu.memoryUsed && <li>Memory Used: {formatBytes(firstGpu.memoryUsed)}</li>}
            {firstGpu.utilizationMemory !== undefined && <li>Memory Utilization: {firstGpu.utilizationMemory}%</li>}
            {firstGpu.powerDraw !== undefined && <li>Power Draw: {firstGpu.powerDraw} W</li>}
            {firstGpu.temperatureGpu !== undefined && <li>Temperature: {firstGpu.temperatureGpu}°C</li>}
            {firstGpu.driverVersion && <li>Driver Version: {firstGpu.driverVersion}</li>}
            {firstGpu.vram !== undefined && <li>VRAM: {firstGpu.vram}</li>}
            {firstGpu.vramDynamic !== undefined && <li>VRAM Dynamic: {firstGpu.vramDynamic}</li>}
          </ul>
        )}
        {deviceInfo?.graphics?.displays && deviceInfo.graphics.displays.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Displays:</h3>
            <ul className="space-y-1 text-sm">
              {deviceInfo.graphics.displays.map((display, idx) => (
                <li key={idx}>
                  {display.model && <div>Model: {display.model}</div>}
                  {display.currentResX && display.currentResY && <div>Resolution: {display.currentResX}x{display.currentResY}</div>}
                  {display.currentRefreshRate && <div>Refresh Rate: {display.currentRefreshRate} Hz</div>}
                  {display.pixelDepth && <div>Pixel Depth: {display.pixelDepth}</div>}
                  {display.builtin !== undefined && <div>Builtin: {display.builtin ? 'Yes' : 'No'}</div>}
                  {display.sizeX && display.sizeY && <div>Size: {display.sizeX}x{display.sizeY} mm</div>}
                  {display.resolutionX && display.resolutionY && <div>Native Resolution: {display.resolutionX}x{display.resolutionY}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Storage Card */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">Storage</h2>
        {deviceInfo?.diskLayout && deviceInfo.diskLayout.length > 0 && (
          <>
            <p className="text-sm mb-2">Total Storage: {formatBytes(totalStorage)}</p>
            <ul className="space-y-2 text-sm">
              {deviceInfo.diskLayout.map((disk, idx) => (
                <li key={idx} className="bg-white/5 p-2 rounded">
                  {disk.name && <div>Name: {disk.name}</div>}
                  {disk.interfaceType && <div>Interface: {disk.interfaceType}</div>}
                  {disk.type && <div>Type: {disk.type}</div>}
                  {disk.vendor && <div>Vendor: {disk.vendor}</div>}
                  {disk.serialNumber && <div>Serial: {disk.serialNumber}</div>}
                  {disk.size && <div>Size: {formatBytes(disk.size)}</div>}
                  {disk.bytesPerSector && <div>Bytes per Sector: {disk.bytesPerSector}</div>}
                  {disk.totalCylinders && <div>Total Cylinders: {disk.totalCylinders}</div>}
                  {disk.totalHeads && <div>Total Heads: {disk.totalHeads}</div>}
                  {disk.totalSectors && <div>Total Sectors: {disk.totalSectors}</div>}
                  {disk.totalTracks && <div>Total Tracks: {disk.totalTracks}</div>}
                  {disk.tracksPerCylinder && <div>Tracks per Cylinder: {disk.tracksPerCylinder}</div>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* RAM Card */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">RAM</h2>
        {deviceInfo?.memLayout && deviceInfo.memLayout.length > 0 && (
          <>
            <p className="text-sm mb-2">Total RAM: {formatBytes(totalRam)}</p>
            <ul className="space-y-2 text-sm">
              {deviceInfo.memLayout.map((mem, idx) => (
                <li key={idx} className="bg-white/5 p-2 rounded">
                  {mem.manufacturer && <div>Manufacturer: {mem.manufacturer}</div>}
                  {mem.partNum && <div>Part Number: {mem.partNum}</div>}
                  {mem.serialNum && <div>Serial Number: {mem.serialNum}</div>}
                  {mem.size && <div>Size: {formatBytes(mem.size)}</div>}
                  {mem.type && <div>Type: {mem.type}</div>}
                  {mem.formFactor && <div>Form Factor: {mem.formFactor}</div>}
                  {mem.clockSpeed && <div>Clock Speed: {mem.clockSpeed} MHz</div>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Author Card */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">Author / System</h2>
        {deviceInfo?.os && (
          <ul className="space-y-1 text-sm">
            {deviceInfo.os.hostname && <li>Hostname: {deviceInfo.os.hostname}</li>}
            {deviceInfo.os.platform && <li>Platform: {deviceInfo.os.platform}</li>}
            {deviceInfo.os.distro && <li>Distro: {deviceInfo.os.distro}</li>}
            {deviceInfo.os.fqdn && <li>FQDN: {deviceInfo.os.fqdn}</li>}
            {deviceInfo.os.serial && <li>Serial: {deviceInfo.os.serial}</li>}
          </ul>
        )}
        {deviceInfo?.system && (
          <ul className="space-y-1 text-sm mt-4">
            {deviceInfo.system.manufacturer && <li>Manufacturer: {deviceInfo.system.manufacturer}</li>}
            {deviceInfo.system.model && <li>Model: {deviceInfo.system.model}</li>}
            {deviceInfo.system.serial && <li>Serial: {deviceInfo.system.serial}</li>}
            {deviceInfo.system.uuid && <li>UUID: {deviceInfo.system.uuid}</li>}
            {deviceInfo.system.virtual !== undefined && <li>Virtual: {deviceInfo.system.virtual ? 'Yes' : 'No'}</li>}
          </ul>
        )}
        {deviceInfo?.bios && (
          <ul className="space-y-1 text-sm mt-4">
            {deviceInfo.bios.vendor && <li>BIOS Vendor: {deviceInfo.bios.vendor}</li>}
            {deviceInfo.bios.version && <li>BIOS Version: {deviceInfo.bios.version}</li>}
            {deviceInfo.bios.releaseDate && <li>BIOS Release Date: {deviceInfo.bios.releaseDate}</li>}
            {deviceInfo.bios.serial && <li>BIOS Serial: {deviceInfo.bios.serial}</li>}
          </ul>
        )}
        {deviceInfo?.baseboard && (
          <ul className="space-y-1 text-sm mt-4">
            {deviceInfo.baseboard.manufacturer && <li>Baseboard Manufacturer: {deviceInfo.baseboard.manufacturer}</li>}
            {deviceInfo.baseboard.model && <li>Baseboard Model: {deviceInfo.baseboard.model}</li>}
            {deviceInfo.baseboard.serial && <li>Baseboard Serial: {deviceInfo.baseboard.serial}</li>}
            {deviceInfo.baseboard.memSlots && <li>Memory Slots: {deviceInfo.baseboard.memSlots}</li>}
          </ul>
        )}
        {deviceInfo?.battery && (
          <ul className="space-y-1 text-sm mt-4">
            {deviceInfo.battery.model && <li>Battery Model: {deviceInfo.battery.model}</li>}
            {deviceInfo.battery.manufacturer && <li>Battery Manufacturer: {deviceInfo.battery.manufacturer}</li>}
            {deviceInfo.battery.serial && <li>Battery Serial: {deviceInfo.battery?.serial}</li>}
            {deviceInfo.battery.designedCapacity && <li>Designed Capacity: {deviceInfo.battery.designedCapacity} mWh</li>}
            {deviceInfo.battery.maxCapacity && <li>Max Capacity: {deviceInfo.battery.maxCapacity} mWh</li>}
            {deviceInfo.battery.currentCapacity && <li>Current Capacity: {deviceInfo.battery.currentCapacity} mWh</li>}
            {deviceInfo.battery.capacityUnit && <li>Capacity Unit: {deviceInfo.battery.capacityUnit}</li>}
            {deviceInfo.battery.percent !== undefined && <li>Percent: {deviceInfo.battery.percent}%</li>}
            {deviceInfo.battery.cycleCount && <li>Cycle Count: {deviceInfo.battery.cycleCount}</li>}
            {deviceInfo.battery.isCharging !== undefined && <li>Is Charging: {deviceInfo.battery.isCharging ? 'Yes' : 'No'}</li>}
            {deviceInfo.battery.acConnected !== undefined && <li>AC Connected: {deviceInfo.battery.acConnected ? 'Yes' : 'No'}</li>}
          </ul>
        )}
        {deviceInfo?.audio && deviceInfo.audio.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Audio:</h3>
            <ul className="space-y-1 text-sm">
              {deviceInfo.audio.map((audio, idx) => (
                <li key={idx}>
                  {audio.name && <div>Name: {audio.name}</div>}
                  {audio.manufacturer && <div>Manufacturer: {audio.manufacturer}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Uptime Card */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">Uptime</h2>
        {deviceInfo?.time && (
          <ul className="space-y-1 text-sm">
            {deviceInfo.time.uptime !== undefined && <li>Uptime: {Math.floor(deviceInfo.time.uptime / 3600)}h {Math.floor((deviceInfo.time.uptime % 3600) / 60)}m {deviceInfo.time.uptime % 60}s</li>}
            {deviceInfo.time.timezone && <li>Timezone: {deviceInfo.time.timezone}</li>}
            {deviceInfo.time.timezoneName && <li>Timezone Name: {deviceInfo.time.timezoneName}</li>}
            {deviceInfo.time.current && <li>Current Time: {new Date(deviceInfo.time.current * 1000).toLocaleString()}</li>}
          </ul>
        )}
      </div>
    </div>
  );
}