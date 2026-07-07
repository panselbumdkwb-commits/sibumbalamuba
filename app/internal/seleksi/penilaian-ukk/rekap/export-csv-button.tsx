"use client";

type Baris = {
  peringkat: number;
  nama: string;
  skor_akhir: number | null;
  sudah_lengkap: boolean;
};

export default function ExportCsvButton({ hasil }: { hasil: Baris[] }) {
  function handleExport() {
    const header = ["Peringkat", "Nama Peserta", "Skor Akhir", "Status"];
    const rows = hasil.map((r) => [
      r.peringkat,
      r.nama,
      r.skor_akhir ?? "",
      r.sudah_lengkap ? "Lengkap" : "Belum Lengkap",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    // Tambahkan BOM supaya Excel membuka karakter non-ASCII dengan benar.
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-hasil-ukk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport} className="btn-secondary">
      📊 Ekspor ke Excel (CSV)
    </button>
  );
}
