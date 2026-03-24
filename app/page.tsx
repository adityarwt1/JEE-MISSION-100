"use client"

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

const HomePage = () => {
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

  const cardStyle = "bg-[rgba(0,0,0,0.45)] backdrop-blur-lg border border-white/20 rounded-2xl p-5 shadow-lg shadow-black/20 text-white";

  return (
    <main className="min-h-screen p-6" style={{ background: "#e0e0e0" }}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-4 text-left text-slate-900">Device Info Dashboard</h1>
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-300 animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-600 font-semibold">{error}</p>}

        {!loading && !error && deviceInfo && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
              <section className={cardStyle}>
                <h2 className="text-xl font-semibold mb-2">Storage</h2>
                <p className="text-sm text-slate-200">Total storage: {formatBytes(totalStorage)}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {deviceInfo.diskLayout?.map((disk, idx) => (
                    <li key={idx} className="rounded-md bg-white/10 p-2">
                      <b>{disk.name ?? disk.interfaceType ?? `Disk ${idx + 1}`}</b>
                      <div>{disk.serialNumber ?? "No serial"}</div>
                      <div>Size: {formatBytes(disk.size)}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={cardStyle}>
                <h2 className="text-xl font-semibold mb-2">CPU</h2>
                <p className="text-sm">Brand: {deviceInfo.cpu?.brand ?? "unknown"}</p>
                <p className="text-sm">Cores: {deviceInfo.cpu?.cores ?? "unknown"}</p>
                <p className="text-sm">Speed: {deviceInfo.cpu?.speed ? `${deviceInfo.cpu.speed} GHz` : "unknown"}</p>
                <p className="text-sm mt-2">Model: {deviceInfo.cpu?.model ?? "unknown"}</p>
              </section>

              <section className={cardStyle}>
                <h2 className="text-xl font-semibold mb-2">GPU</h2>
                <p className="text-sm">Name: {firstGpu?.name ?? "unknown"}</p>
                <p className="text-sm">Vendor: {firstGpu?.vendor ?? "unknown"}</p>
                <p className="text-sm">Memory total: {formatBytes(firstGpu?.memoryTotal)}</p>
                <p className="text-sm">Driver: {firstGpu?.driverVersion ?? "unknown"}</p>
              </section>

              <section className={cardStyle}>
                <h2 className="text-xl font-semibold mb-2">RAM</h2>
                <p className="text-sm">Total RAM: {formatBytes(totalRam)}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {deviceInfo.memLayout?.map((mem, idx) => (
                    <li key={idx} className="rounded-md bg-white/10 p-2">
                      <div>Manufacturer: {mem.manufacturer ?? "unknown"}</div>
                      <div>Size: {formatBytes(mem.size)}</div>
                      <div>Type: {mem.type ?? "unknown"}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={cardStyle}>
                <h2 className="text-xl font-semibold mb-2">Author / System</h2>
                <p className="text-sm">Hostname: {deviceInfo.os?.hostname ?? "unknown"}</p>
                <p className="text-sm">OS: {deviceInfo.os?.platform ?? "unknown"} {deviceInfo.os?.distro ?? ""}</p>
                <p className="text-sm">User: {deviceInfo.os?.fqdn ?? "unknown"}</p>
                <p className="text-sm">Serial: {deviceInfo.system?.serial ?? "unknown"}</p>
              </section>

              <section className={cardStyle}>
                <h2 className="text-xl font-semibold mb-2">Time</h2>
                <p className="text-sm">Uptime: {deviceInfo.time?.uptime ?? 0} sec</p>
                <p className="text-sm">Timezone: {deviceInfo.time?.timezoneName ?? deviceInfo.time?.timezone ?? "unknown"}</p>
              </section>
            </div>

            <section className={`${cardStyle} p-6`}>
              <h2 className="text-xl font-semibold mb-2">Full API payload</h2>
              <pre className="text-xs overflow-auto max-h-96 bg-black/30 p-3 rounded-lg">
                {JSON.stringify(deviceInfo, null, 2)}
              </pre>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default HomePage;
