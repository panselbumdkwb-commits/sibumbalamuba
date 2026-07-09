"use client";

import { useState } from "react";
import KepatuhanSection from "./kepatuhan-section";
import InovasiSection from "./inovasi-section";
import TindakLanjutSection from "./tindak-lanjut-section";

type Blud = { id: string; nama: string };
type Kepatuhan = {
  id: string;
  blud_id: string;
  jenis: string;
  status: string;
  tanggal_pemenuhan: string | null;
  keterangan: string | null;
};
type Inovasi = {
  id: string;
  blud_id: string;
  nama_inovasi: string;
  kategori: string;
  deskripsi: string | null;
  manfaat: string | null;
  status: string;
};
type TindakLanjut = {
  id: string;
  blud_id: string;
  sumber: string;
  rekomendasi: string;
  rencana_tindak_lanjut: string | null;
  persentase_penyelesaian: number;
  target_penyelesaian: string | null;
  status: string;
};

const TABS = [
  { key: "kepatuhan", label: "Kepatuhan PPK-BLUD", icon: "✅" },
  { key: "inovasi", label: "Inovasi Pelayanan", icon: "💡" },
  { key: "tindak-lanjut", label: "Tindak Lanjut Rekomendasi", icon: "🔧" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function TataKelolaTabs({
  bludList,
  kepatuhanList,
  inovasiList,
  tindakLanjutList,
  canManage,
  tahun,
}: {
  bludList: Blud[];
  kepatuhanList: Kepatuhan[];
  inovasiList: Inovasi[];
  tindakLanjutList: TindakLanjut[];
  canManage: boolean;
  tahun: number;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("kepatuhan");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-primary-700 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "kepatuhan" && (
        <KepatuhanSection bludList={bludList} kepatuhanList={kepatuhanList} canManage={canManage} tahun={tahun} />
      )}
      {activeTab === "inovasi" && (
        <InovasiSection bludList={bludList} inovasiList={inovasiList} canManage={canManage} tahun={tahun} />
      )}
      {activeTab === "tindak-lanjut" && (
        <TindakLanjutSection bludList={bludList} tindakLanjutList={tindakLanjutList} canManage={canManage} tahun={tahun} />
      )}
    </div>
  );
}
