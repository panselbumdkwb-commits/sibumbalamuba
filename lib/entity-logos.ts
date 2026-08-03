/**
 * Peta nama entitas -> path logo resmi di /public/logos.
 * Dicocokkan berdasarkan nama persis seperti tersimpan di tabel bumd/blud.
 * Entitas yang belum punya logo (mis. BLUD Puskesmas) otomatis memakai
 * avatar inisial sebagai fallback — lihat komponen EntityLogo.
 */
export const ENTITY_LOGOS: Record<string, string> = {
  "Perumdam Among Tirto": "/logos/among-tirto.png",
  "PT. Batu Wisata Resource": "/logos/bwr.png",
};
