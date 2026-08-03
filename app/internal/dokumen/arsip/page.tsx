import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "../../_components/page-header";
import SuratRow from "../surat-row";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  diajukan: "Menunggu Persetujuan",
  disetujui: "Disetujui & Ditandatangani",
  ditolak: "Ditolak — Perlu Revisi",
  diarsipkan: "Diarsipkan",
};

// Arsip Surat — pencarian atas SEMUA surat (bukan cuma yang sudah
// bernomor) berdasarkan nomor surat, perihal, tujuan (kepada), dan
// rentang tanggal. Dibuat sebagai form GET biasa (searchParams di
// URL) supaya hasil pencarian bisa dibagikan/di-bookmark dan tetap
// jalan tanpa JavaScript — cocok untuk kebutuhan arsip yang harus
// gampang ditelusuri kembali di kemudian hari.
export default async function ArsipSuratPage({
  searchParams,
}: {
  searchParams: Promise<{ nomor?: string; judul?: string; kepada?: string; dari?: string; sampai?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["panitia_seleksi", "ketua_pansel", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const isKetua = profile.role === "ketua_pansel" || profile.role === "super_admin";
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("dokumen_internal")
    .select(
      "id, judul, status, pembuat_id, approver_id, versi, nomor_surat, jenis_naskah, sifat, lampiran, kepada, isi_surat, tembusan, entitas_seleksi, catatan_revisi, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (params.nomor) query = query.ilike("nomor_surat", `%${params.nomor}%`);
  if (params.judul) query = query.ilike("judul", `%${params.judul}%`);
  if (params.kepada) query = query.ilike("kepada", `%${params.kepada}%`);
  if (params.dari) query = query.gte("created_at", params.dari);
  if (params.sampai) query = query.lte("created_at", `${params.sampai}T23:59:59`);

  const { data: dokumen } = await query;

  const adaFilter = Boolean(params.nomor || params.judul || params.kepada || params.dari || params.sampai);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🗄️"
        color="bg-indigo-50 text-indigo-700"
        title="Arsip Surat"
        description="Cari surat yang sudah dibuat berdasarkan nomor surat, perihal, tujuan, atau tanggal."
      />

      <Link href="/internal/dokumen" className="text-sm text-primary-700 hover:underline w-fit">
        ← Kembali ke Surat &amp; Dokumen
      </Link>

      <form className="card p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="label">Nomor Surat</label>
          <input name="nomor" defaultValue={params.nomor} className="input" placeholder="mis. 001/PANSEL" />
        </div>
        <div>
          <label className="label">Perihal</label>
          <input name="judul" defaultValue={params.judul} className="input" placeholder="mis. seleksi komisaris" />
        </div>
        <div>
          <label className="label">Tujuan (Kepada)</label>
          <input name="kepada" defaultValue={params.kepada} className="input" placeholder="mis. Wali Kota Batu" />
        </div>
        <div>
          <label className="label">Dari Tanggal</label>
          <input type="date" name="dari" defaultValue={params.dari} className="input" />
        </div>
        <div>
          <label className="label">Sampai Tanggal</label>
          <input type="date" name="sampai" defaultValue={params.sampai} className="input" />
        </div>
        <div className="lg:col-span-5 flex gap-2">
          <button type="submit" className="btn-primary">Cari</button>
          {adaFilter && (
            <Link href="/internal/dokumen/arsip" className="btn-ghost">
              Reset
            </Link>
          )}
        </div>
      </form>

      <p className="text-xs text-slate-400">
        {adaFilter
          ? `${dokumen?.length ?? 0} surat ditemukan`
          : `Menampilkan seluruh arsip · ${dokumen?.length ?? 0} surat`}
      </p>

      <div className="flex flex-col gap-3">
        {dokumen?.map((d) => (
          <SuratRow
            key={d.id}
            surat={{
              id: d.id,
              judul: d.judul,
              status: d.status,
              statusLabel: STATUS_LABEL[d.status] ?? d.status,
              isPembuat: d.pembuat_id === profile.id,
              adaApprover: Boolean(d.approver_id),
              tanggal: d.updated_at,
              nomorSurat: d.nomor_surat,
              jenisNaskah: d.jenis_naskah,
              sifat: d.sifat,
              lampiran: d.lampiran,
              kepada: d.kepada,
              isiSurat: d.isi_surat,
              tembusan: d.tembusan,
              entitasSeleksi: d.entitas_seleksi,
              catatanRevisi: d.catatan_revisi,
            }}
            isKetua={isKetua}
          />
        ))}
        {!dokumen?.length && (
          <p className="text-sm text-slate-400">Tidak ada surat yang cocok dengan pencarian.</p>
        )}
      </div>
    </main>
  );
}
