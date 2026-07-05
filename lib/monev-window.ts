/**
 * Jendela waktu input data Monev oleh Admin BUMD: tanggal 1 s.d. 10
 * setiap bulan (WIB) — sesuai kebijakan pembinaan agar laporan masuk
 * tepat waktu di awal bulan. super_admin selalu boleh input kapan saja
 * (untuk keperluan koreksi/darurat).
 *
 * Dihitung berdasarkan WAKTU SERVER dikonversi ke Asia/Jakarta — bukan
 * jam di komputer pengguna — supaya tidak bisa dilewati dengan mengubah
 * jam perangkat sendiri.
 */
export function tanggalHariIniWib(referenceDate: Date = new Date()): number {
  const jakartaDay = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
  }).format(referenceDate);
  return parseInt(jakartaDay, 10);
}

export function dalamJendelaInputMonev(referenceDate: Date = new Date()): boolean {
  const tanggal = tanggalHariIniWib(referenceDate);
  return tanggal >= 1 && tanggal <= 10;
}

export const PESAN_DI_LUAR_JENDELA_MONEV =
  "Input data Monev BUMD hanya dibuka tanggal 1–10 setiap bulan (WIB). Coba lagi di awal bulan berikutnya, atau hubungi Super Admin kalau ada kondisi mendesak.";
