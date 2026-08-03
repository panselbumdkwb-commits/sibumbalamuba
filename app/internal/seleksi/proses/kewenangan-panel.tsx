const BERWENANG = [
  "Menetapkan jadwal seleksi",
  "Memverifikasi administrasi",
  "Menggugurkan peserta yang tidak memenuhi syarat",
  "Menetapkan hasil setiap tahapan seleksi",
  "Menyusun rekomendasi kepada Kepala Daerah/KPM",
];

const TIDAK_BERWENANG = [
  "Mengangkat Direksi/Komisaris/Dewan Pengawas",
  "Mengubah persyaratan yang telah diumumkan tanpa dasar hukum",
  "Mengubah hasil penilaian Tim Penguji tanpa dasar yang sah",
  "Menetapkan pejabat terpilih sebagai pengangkatan definitif",
  "Mengintervensi independensi Tim Penguji",
];

const PRINSIP = [
  { nama: "Objektif", ket: "Penilaian berdasarkan indikator yang telah ditetapkan." },
  { nama: "Transparan", ket: "Seluruh tahapan dan hasil diumumkan sesuai ketentuan." },
  { nama: "Akuntabel", ket: "Setiap keputusan didukung berita acara dan dokumen yang dapat dipertanggungjawabkan." },
  { nama: "Profesional", ket: "Dilaksanakan oleh personel yang kompeten dan independen." },
  { nama: "Adil", ket: "Semua peserta memperoleh perlakuan yang sama." },
  { nama: "Bebas Benturan Kepentingan", ket: "Anggota Panitia Seleksi wajib menghindari konflik kepentingan." },
];

export default function KewenanganPanel() {
  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-medium text-slate-900 text-sm">
        📖 Kewenangan &amp; Prinsip Kerja Panitia Seleksi (klik untuk lihat)
      </summary>
      <div className="mt-4 grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-accent-700 uppercase tracking-wide mb-2">Berwenang</p>
          <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
            {BERWENANG.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">Tidak Berwenang</p>
          <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
            {TIDAK_BERWENANG.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Prinsip Kerja</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {PRINSIP.map((p) => (
            <div key={p.nama} className="text-xs text-slate-600">
              <span className="font-medium text-slate-800">{p.nama}:</span> {p.ket}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
