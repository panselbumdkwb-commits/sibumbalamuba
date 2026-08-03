import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "../_components/page-header";

const AKSI_LABEL: Record<string, string> = {
  buat_akun_internal: "Membuat akun internal baru",
  reset_password_akun: "Reset password akun",
  aktifkan_akun: "Mengaktifkan akun",
  nonaktifkan_akun: "Menonaktifkan akun",
  batalkan_pendaftaran_seleksi: "Membatalkan pendaftaran peserta",
  tandatangani_surat: "Menyetujui & menandatangani surat",
  tolak_surat: "Menolak surat",
  insert_bumd_realisasi: "Melapor realisasi kinerja BUMD",
  update_bumd_realisasi: "Memperbarui/menanggapi realisasi BUMD",
  insert_blud_realisasi: "Melapor realisasi kinerja BLUD",
  update_blud_realisasi: "Memperbarui/menanggapi realisasi BLUD",
  insert_bumd_risiko: "Mencatat risiko BUMD baru",
  update_bumd_risiko: "Memperbarui status risiko BUMD",
  insert_blud_risiko: "Mencatat risiko BLUD baru",
  update_blud_risiko: "Memperbarui status risiko BLUD",
  insert_bumd_kpi: "Menambah target KPI BUMD",
  insert_blud_kpi: "Menambah target KPI BLUD",
  insert_bumd_rkap: "Menyimpan RKAP BUMD",
  update_bumd_rkap: "Memperbarui RKAP BUMD",
  insert_blud_renstra_rba: "Menyimpan Renstra/RBA BLUD",
  update_blud_renstra_rba: "Memperbarui Renstra/RBA BLUD",
  update_bumd: "Memperbarui profil BUMD",
  update_blud: "Memperbarui profil BLUD",
};

function labelAksi(aksi: string) {
  return AKSI_LABEL[aksi] ?? aksi.replace(/_/g, " ");
}

/**
 * FR terkait audit: hanya super_admin yang boleh melihat seluruh log
 * (RLS "audit_log_select_super_admin_full"). requireRole() di sini adalah
 * lapisan kedua (UX + defense in depth) — RLS tetap penjaga utama.
 *
 * Sejak migration 0014, tabel ini juga terisi OTOMATIS lewat trigger
 * database setiap ada insert/update di tabel data Monev — bukan cuma
 * dari insert manual di kode aplikasi.
 */
export default async function AuditLogPage() {
  await requireRole(["super_admin"]);

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_log")
    .select("id, aksi, tabel_terkait, record_id, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set(logs?.map((l) => l.user_id).filter((id): id is string => Boolean(id)) ?? [])];
  const { data: pelakuList } = userIds.length
    ? await supabase.from("profiles").select("id, nama_lengkap, role").in("id", userIds)
    : { data: [] };

  const pelaku = (id: string | null) => pelakuList?.find((p) => p.id === id);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🛡️"
        color="bg-slate-100 text-slate-700"
        title="Audit Log"
        description="100 pembaruan data terbaru — siapa, kapan (WIB), dan pekerjaan apa yang dilakukan. Tercatat otomatis, tidak bisa dihapus atau diubah."
      />

      <div className="flex flex-col gap-2">
        {logs?.map((log) => {
          const p = pelaku(log.user_id);
          return (
            <div key={log.id} className="card p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{p?.nama_lengkap ?? "Sistem"}</span>
                  {p?.role && <span className="text-slate-400"> ({p.role})</span>} — {labelAksi(log.aksi)}
                </p>
                {log.tabel_terkait && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tabel: {log.tabel_terkait}
                    {log.record_id && <span> · ID: {log.record_id}</span>}
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                {new Intl.DateTimeFormat("id-ID", {
                  timeZone: "Asia/Jakarta",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(log.created_at))}{" "}
                WIB
              </span>
            </div>
          );
        })}

        {!logs?.length && (
          <p className="text-sm text-slate-400 text-center py-6">Belum ada aksi tercatat.</p>
        )}
      </div>
    </main>
  );
}
