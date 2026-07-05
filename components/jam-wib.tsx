"use client";

import { useEffect, useState } from "react";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/**
 * Jam berjalan mengikuti WIB (Asia/Jakarta), TERLEPAS dari timezone
 * server/browser pengguna — dipakai Intl.DateTimeFormat dengan
 * timeZone eksplisit, bukan sekadar +7 jam manual (yang bisa salah
 * kalau server sudah di UTC+lain atau ada perubahan aturan DST di
 * masa depan).
 */
export default function JamWib() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const jakartaParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const hariIndeks = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(now);
  const hariIni = HARI[
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(hariIndeks)
  ];

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
      <span className="hidden sm:inline">{hariIni},</span>
      <span>
        {jakartaParts.day} {jakartaParts.month} {jakartaParts.year}
      </span>
      <span className="text-slate-300">•</span>
      <span className="font-medium text-slate-700">
        {jakartaParts.hour}:{jakartaParts.minute}:{jakartaParts.second} WIB
      </span>
    </div>
  );
}
