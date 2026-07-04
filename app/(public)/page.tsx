import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLandingPage() {
  const supabase = await createClient();

  const [{ data: bumdList }, { data: bludList }] = await Promise.all([
    supabase.from("bumd").select("id, nama, jenis_usaha, status").order("nama"),
    supabase.from("blud").select("id, nama, jenis_layanan, status").order("nama"),
  ]);

  const totalEntitas = (bumdList?.length ?? 0) + (bludList?.length ?? 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-900 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center">
          <span className="badge bg-white/10 text-white/80 border border-white/20 mb-5">
            Portal Resmi Pemerintah Kota Batu
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Transparansi Tata Kelola BUMD &amp; BLUD Kota Batu
          </h1>
          <p className="mt-5 text-primary-100/90 max-w-xl mx-auto text-sm sm:text-base">
            Satu sistem terpadu untuk monitoring kinerja, evaluasi, dan
            seleksi Direksi, Dewan Pengawas, dan Komisaris — akuntabel,
            aman, dan berpedoman pada regulasi yang berlaku.
          </p>

          <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <Stat value={String(totalEntitas)} label="Entitas Terdaftar" />
            <Stat value={String(bumdList?.length ?? 0)} label="BUMD" />
            <Stat value={String(bludList?.length ?? 0)} label="BLUD" />
          </div>
        </div>
      </section>

      <main className="flex-1">
        <section id="bumd" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
          <SectionHeader
            eyebrow="Transparansi"
            title="Badan Usaha Milik Daerah (BUMD)"
            desc="Entitas usaha daerah yang bergerak mencari keuntungan sekaligus memberi layanan publik, sesuai PP No. 54/2017."
          />
          <EntityGrid items={bumdList} subtitleKey="jenis_usaha" empty="Belum ada data BUMD yang dipublikasikan." />
        </section>

        <section id="blud" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
          <SectionHeader
            eyebrow="Transparansi"
            title="Badan Layanan Umum Daerah (BLUD)"
            desc="Unit kerja pemda dengan fleksibilitas pengelolaan keuangan untuk layanan publik, sesuai Permendagri No. 79/2018."
          />
          <EntityGrid items={bludList} subtitleKey="jenis_layanan" empty="Belum ada data BLUD yang dipublikasikan." />
        </section>

        <section id="evaluasi" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
          <SectionHeader
            eyebrow="Akuntabilitas"
            title="Evaluasi Kinerja"
            desc="Hasil evaluasi kinerja tahunan yang berstatus 'dipublikasikan' tampil di sini secara otomatis. Evaluasi yang masih berjalan (draft/proses verifikasi) tidak ditampilkan ke publik."
          />
          <div className="card p-6 text-sm text-slate-500">
            Ringkasan skor evaluasi per periode akan tampil di sini setelah
            modul Monev BUMD/BLUD Performance-Based aktif. Data mentah
            penilaian tidak pernah ditampilkan ke publik — hanya skor akhir
            dan kategori yang sudah melalui proses verifikasi berjenjang.
          </div>
        </section>

        <section id="seleksi" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
          <SectionHeader
            eyebrow="Karier"
            title="Seleksi Direksi, Dewan Pengawas &amp; Komisaris"
            desc="Pendaftaran terbuka mengikuti jadwal panitia seleksi. Seluruh tahapan — administrasi, psikotes, tes tertulis, uji kompetensi (UKK), presentasi, hingga wawancara — dicatat sistem dan dapat dipantau peserta secara mandiri."
          />
          <div className="card p-6">
            <p className="text-sm text-slate-600 max-w-lg">
              Sudah punya akun peserta atau ingin mendaftar? Gunakan tombol{" "}
              <span className="font-medium">Peserta Seleksi</span> di
              bagian atas atau bawah halaman ini.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/10 py-3">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-primary-100/70 mt-0.5">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <span className="text-xs font-medium text-primary-700 uppercase tracking-wide">{eyebrow}</span>
      <h2 className="text-2xl font-semibold text-slate-900 mt-1">{title}</h2>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function EntityGrid({
  items,
  subtitleKey,
  empty,
}: {
  items: { id: string; nama: string; status: string; [key: string]: string | null }[] | null;
  subtitleKey: string;
  empty: string;
}) {
  if (!items?.length) {
    return <div className="card p-6 text-sm text-slate-400">{empty}</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-slate-900">{item.nama}</p>
            <span
              className={`badge shrink-0 ${
                item.status === "aktif"
                  ? "bg-accent-50 text-accent-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{item[subtitleKey]}</p>
        </div>
      ))}
    </div>
  );
}
