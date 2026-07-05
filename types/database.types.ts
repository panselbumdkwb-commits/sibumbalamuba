/**
 * Tipe TypeScript untuk seluruh skema Supabase (supabase/migrations/0001, 0002).
 *
 * Ditulis manual agar type-check lolos tanpa koneksi Supabase saat build
 * (mis. di CI/Vercel). Begitu project Supabase asli sudah menjalankan kedua
 * migration, disarankan generate ulang dari sumber kebenaran sebenarnya:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_ID> \
 *     --schema public > types/database.types.ts
 *
 * dan bandingkan hasilnya dengan file ini (harus identik secara struktur).
 */

export type UserRole =
  | "super_admin"
  | "admin_bpsda"
  | "admin_bumd"
  | "admin_blud"
  | "panitia_seleksi"
  | "ketua_pansel"
  | "tim_ukk"
  | "peserta"
  | "eksekutif";

export type EntityType = "bumd" | "blud";
export type JenisSeleksi = "direksi" | "dewas" | "komisaris" | "pegawai_blud";
export type JalurPendaftaran = "mandiri" | "assisted";
export type StatusSeleksi =
  | "terdaftar"
  | "administrasi"
  | "lolos_administrasi"
  | "penilaian"
  | "selesai"
  | "ditolak"
  | "mengundurkan_diri";
export type TahapPenilaian =
  | "psikotes"
  | "tes_tulis"
  | "ukk"
  | "presentasi"
  | "wawancara";
export type StatusDokumen = "draft" | "diajukan" | "disetujui" | "ditolak" | "diarsipkan";

export type KategoriIku = "keuangan" | "operasional" | "pelayanan" | "tata_kelola" | "kontribusi_daerah";
export type JenisPeriodeMonev =
  | "triwulan_1"
  | "triwulan_2"
  | "triwulan_3"
  | "triwulan_4"
  | "semester_1"
  | "semester_2"
  | "tahunan";
export type TingkatRisiko = "rendah" | "sedang" | "tinggi";
export type KategoriRisiko = "strategis" | "keuangan" | "operasional" | "sdm" | "hukum" | "reputasi";
export type StatusTindakLanjut = "belum_ditangani" | "dalam_proses" | "selesai";
export type JenisKepatuhan = "rkap" | "laporan_triwulan" | "laporan_tahunan" | "opini_auditor" | "perizinan";
export type StatusKepatuhan = "tepat_waktu" | "terlambat" | "belum_disampaikan";

export type StatusBludEnum = "penuh" | "bertahap";
export type KategoriIkuBlud = "pelayanan" | "keuangan" | "tata_kelola" | "sdm" | "pengembangan";
export type JenisPeriodeBlud = "bulanan" | "triwulanan" | "semester" | "tahunan";
export type StatusVerifikasiBlud = "belum_diverifikasi" | "perlu_perbaikan" | "disetujui";
export type KategoriRisikoBlud = "strategis" | "pelayanan" | "sdm" | "keuangan" | "teknologi_informasi" | "hukum";
export type JenisKepatuhanBlud =
  | "rba"
  | "laporan_keuangan"
  | "laporan_kinerja"
  | "opini_auditor"
  | "ppk_blud"
  | "pengadaan"
  | "perpajakan";
export type KategoriInovasi = "digitalisasi" | "sistem_informasi" | "integrasi_layanan" | "simplifikasi_prosedur" | "lainnya";
export type StatusInovasi = "direncanakan" | "berjalan" | "selesai";
export type SumberRekomendasi = "audit_internal" | "audit_eksternal" | "evaluasi_bpsda" | "lainnya";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          nama_lengkap: string;
          username: string | null;
          nip_nik: string | null;
          entity_type: EntityType | null;
          entity_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          nama_lengkap: string;
          username?: string | null;
          nip_nik?: string | null;
          entity_type?: EntityType | null;
          entity_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<{
          role: UserRole;
          nama_lengkap: string;
          username: string | null;
          nip_nik: string | null;
          entity_type: EntityType | null;
          entity_id: string | null;
          is_active: boolean;
        }>;
        Relationships: [];
      };

      bumd: {
        Row: {
          id: string;
          nama: string;
          jenis_usaha: string | null;
          status: string;
          profil_singkat: string | null;
          bentuk_hukum: string | null;
          nomor_perda: string | null;
          tahun_berdiri: number | null;
          modal_dasar: number | null;
          modal_disetor: number | null;
          penyertaan_modal_pemda: number | null;
          persentase_kepemilikan_daerah: number | null;
          alamat_kantor: string | null;
          website: string | null;
          npwp: string | null;
          nib: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          jenis_usaha?: string | null;
          status?: string;
          profil_singkat?: string | null;
          bentuk_hukum?: string | null;
          nomor_perda?: string | null;
          tahun_berdiri?: number | null;
          modal_dasar?: number | null;
          modal_disetor?: number | null;
          penyertaan_modal_pemda?: number | null;
          persentase_kepemilikan_daerah?: number | null;
          alamat_kantor?: string | null;
          website?: string | null;
          npwp?: string | null;
          nib?: string | null;
        };
        Update: Partial<{
          nama: string;
          jenis_usaha: string | null;
          status: string;
          profil_singkat: string | null;
          bentuk_hukum: string | null;
          nomor_perda: string | null;
          tahun_berdiri: number | null;
          modal_dasar: number | null;
          modal_disetor: number | null;
          penyertaan_modal_pemda: number | null;
          persentase_kepemilikan_daerah: number | null;
          alamat_kantor: string | null;
          website: string | null;
          npwp: string | null;
          nib: string | null;
        }>;
        Relationships: [];
      };

      blud: {
        Row: {
          id: string;
          nama: string;
          jenis_layanan: string | null;
          status: string;
          profil_singkat: string | null;
          opd_induk: string | null;
          dasar_hukum_pembentukan: string | null;
          status_blud: StatusBludEnum | null;
          tahun_penetapan: number | null;
          alamat_kantor: string | null;
          wilayah_pelayanan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          jenis_layanan?: string | null;
          status?: string;
          profil_singkat?: string | null;
          opd_induk?: string | null;
          dasar_hukum_pembentukan?: string | null;
          status_blud?: StatusBludEnum | null;
          tahun_penetapan?: number | null;
          alamat_kantor?: string | null;
          wilayah_pelayanan?: string | null;
        };
        Update: Partial<{
          nama: string;
          jenis_layanan: string | null;
          status: string;
          profil_singkat: string | null;
          opd_induk: string | null;
          dasar_hukum_pembentukan: string | null;
          status_blud: StatusBludEnum | null;
          tahun_penetapan: number | null;
          alamat_kantor: string | null;
          wilayah_pelayanan: string | null;
        }>;
        Relationships: [];
      };

      bumd_organ: {
        Row: {
          id: string;
          bumd_id: string;
          nama: string;
          jabatan: string;
          sk_pengangkatan: string | null;
          mulai_menjabat: string | null;
          akhir_menjabat: string | null;
          pendidikan_terakhir: string | null;
          sertifikat_kompetensi: string | null;
          kehadiran_rups_persen: number | null;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          nama: string;
          jabatan: string;
          sk_pengangkatan?: string | null;
          mulai_menjabat?: string | null;
          akhir_menjabat?: string | null;
          pendidikan_terakhir?: string | null;
          sertifikat_kompetensi?: string | null;
          kehadiran_rups_persen?: number | null;
          is_aktif?: boolean;
        };
        Update: Partial<{
          nama: string;
          jabatan: string;
          sk_pengangkatan: string | null;
          mulai_menjabat: string | null;
          akhir_menjabat: string | null;
          pendidikan_terakhir: string | null;
          sertifikat_kompetensi: string | null;
          kehadiran_rups_persen: number | null;
          is_aktif: boolean;
        }>;
        Relationships: [];
      };

      bumd_rencana_bisnis: {
        Row: {
          id: string;
          bumd_id: string;
          tahun_mulai: number;
          tahun_selesai: number;
          ringkasan: string | null;
          file_path: string | null;
          status: StatusDokumen;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          tahun_mulai: number;
          tahun_selesai: number;
          ringkasan?: string | null;
          file_path?: string | null;
          status?: StatusDokumen;
        };
        Update: Partial<{
          tahun_mulai: number;
          tahun_selesai: number;
          ringkasan: string | null;
          file_path: string | null;
          status: StatusDokumen;
        }>;
        Relationships: [];
      };

      bumd_rkap: {
        Row: {
          id: string;
          bumd_id: string;
          tahun: number;
          target_pendapatan: number | null;
          target_laba: number | null;
          target_dividen: number | null;
          target_investasi: number | null;
          status: StatusDokumen;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          tahun: number;
          target_pendapatan?: number | null;
          target_laba?: number | null;
          target_dividen?: number | null;
          target_investasi?: number | null;
          status?: StatusDokumen;
        };
        Update: Partial<{
          tahun: number;
          target_pendapatan: number | null;
          target_laba: number | null;
          target_dividen: number | null;
          target_investasi: number | null;
          status: StatusDokumen;
        }>;
        Relationships: [];
      };

      bumd_kpi: {
        Row: {
          id: string;
          bumd_id: string;
          tahun: number;
          kategori: KategoriIku;
          nama_indikator: string;
          target_nilai: number;
          satuan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          tahun: number;
          kategori: KategoriIku;
          nama_indikator: string;
          target_nilai: number;
          satuan?: string | null;
        };
        Update: Partial<{
          tahun: number;
          kategori: KategoriIku;
          nama_indikator: string;
          target_nilai: number;
          satuan: string | null;
        }>;
        Relationships: [];
      };

      bumd_realisasi: {
        Row: {
          id: string;
          bumd_kpi_id: string;
          periode: JenisPeriodeMonev;
          nilai_realisasi: number;
          catatan: string | null;
          analisis_penyebab: string | null;
          rencana_tindak_lanjut: string | null;
          bukti_dukung_url: string | null;
          catatan_verifikasi: string | null;
          status_verifikasi: string;
          diinput_oleh: string | null;
          diverifikasi_oleh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bumd_kpi_id: string;
          periode: JenisPeriodeMonev;
          nilai_realisasi: number;
          catatan?: string | null;
          analisis_penyebab?: string | null;
          rencana_tindak_lanjut?: string | null;
          bukti_dukung_url?: string | null;
          catatan_verifikasi?: string | null;
          status_verifikasi?: string;
          diinput_oleh?: string | null;
          diverifikasi_oleh?: string | null;
        };
        Update: Partial<{
          nilai_realisasi: number;
          catatan: string | null;
          analisis_penyebab: string | null;
          rencana_tindak_lanjut: string | null;
          bukti_dukung_url: string | null;
          catatan_verifikasi: string | null;
          status_verifikasi: string;
          diverifikasi_oleh: string | null;
        }>;
        Relationships: [];
      };

      bumd_risiko: {
        Row: {
          id: string;
          bumd_id: string;
          tahun: number;
          kategori: KategoriRisiko;
          deskripsi: string;
          tingkat: TingkatRisiko;
          mitigasi: string | null;
          status: StatusTindakLanjut;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          tahun: number;
          kategori: KategoriRisiko;
          deskripsi: string;
          tingkat: TingkatRisiko;
          mitigasi?: string | null;
          status?: StatusTindakLanjut;
        };
        Update: Partial<{
          tahun: number;
          kategori: KategoriRisiko;
          deskripsi: string;
          tingkat: TingkatRisiko;
          mitigasi: string | null;
          status: StatusTindakLanjut;
        }>;
        Relationships: [];
      };

      bumd_kepatuhan: {
        Row: {
          id: string;
          bumd_id: string;
          tahun: number;
          jenis: JenisKepatuhan;
          status: StatusKepatuhan;
          tanggal_pemenuhan: string | null;
          keterangan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          tahun: number;
          jenis: JenisKepatuhan;
          status?: StatusKepatuhan;
          tanggal_pemenuhan?: string | null;
          keterangan?: string | null;
        };
        Update: Partial<{
          tahun: number;
          jenis: JenisKepatuhan;
          status: StatusKepatuhan;
          tanggal_pemenuhan: string | null;
          keterangan: string | null;
        }>;
        Relationships: [];
      };

      blud_pejabat_pengelola: {
        Row: {
          id: string;
          blud_id: string;
          nama: string;
          jabatan: string;
          sk_pengangkatan: string | null;
          mulai_menjabat: string | null;
          akhir_menjabat: string | null;
          is_aktif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          nama: string;
          jabatan: string;
          sk_pengangkatan?: string | null;
          mulai_menjabat?: string | null;
          akhir_menjabat?: string | null;
          is_aktif?: boolean;
        };
        Update: Partial<{
          nama: string;
          jabatan: string;
          sk_pengangkatan: string | null;
          mulai_menjabat: string | null;
          akhir_menjabat: string | null;
          is_aktif: boolean;
        }>;
        Relationships: [];
      };

      blud_renstra_rba: {
        Row: {
          id: string;
          blud_id: string;
          tahun: number;
          target_pendapatan: number | null;
          target_belanja: number | null;
          ringkasan_target_layanan: string | null;
          file_path: string | null;
          status: StatusDokumen;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          tahun: number;
          target_pendapatan?: number | null;
          target_belanja?: number | null;
          ringkasan_target_layanan?: string | null;
          file_path?: string | null;
          status?: StatusDokumen;
        };
        Update: Partial<{
          tahun: number;
          target_pendapatan: number | null;
          target_belanja: number | null;
          ringkasan_target_layanan: string | null;
          file_path: string | null;
          status: StatusDokumen;
        }>;
        Relationships: [];
      };

      blud_kpi: {
        Row: {
          id: string;
          blud_id: string;
          tahun: number;
          kategori: KategoriIkuBlud;
          nama_indikator: string;
          target_nilai: number;
          satuan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          tahun: number;
          kategori: KategoriIkuBlud;
          nama_indikator: string;
          target_nilai: number;
          satuan?: string | null;
        };
        Update: Partial<{
          tahun: number;
          kategori: KategoriIkuBlud;
          nama_indikator: string;
          target_nilai: number;
          satuan: string | null;
        }>;
        Relationships: [];
      };

      blud_realisasi: {
        Row: {
          id: string;
          blud_kpi_id: string;
          jenis_periode: JenisPeriodeBlud;
          nomor_periode: number;
          tahun: number;
          nilai_realisasi: number;
          analisis_penyebab: string | null;
          rencana_tindak_lanjut: string | null;
          bukti_dukung_url: string | null;
          status_verifikasi: StatusVerifikasiBlud;
          catatan_verifikasi: string | null;
          diinput_oleh: string | null;
          diverifikasi_oleh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blud_kpi_id: string;
          jenis_periode: JenisPeriodeBlud;
          nomor_periode: number;
          tahun: number;
          nilai_realisasi: number;
          analisis_penyebab?: string | null;
          rencana_tindak_lanjut?: string | null;
          bukti_dukung_url?: string | null;
          status_verifikasi?: StatusVerifikasiBlud;
          catatan_verifikasi?: string | null;
          diinput_oleh?: string | null;
          diverifikasi_oleh?: string | null;
        };
        Update: Partial<{
          nilai_realisasi: number;
          analisis_penyebab: string | null;
          rencana_tindak_lanjut: string | null;
          bukti_dukung_url: string | null;
          status_verifikasi: StatusVerifikasiBlud;
          catatan_verifikasi: string | null;
          diverifikasi_oleh: string | null;
        }>;
        Relationships: [];
      };

      blud_risiko: {
        Row: {
          id: string;
          blud_id: string;
          tahun: number;
          kategori: KategoriRisikoBlud;
          deskripsi: string;
          tingkat: TingkatRisiko;
          mitigasi: string | null;
          status: StatusTindakLanjut;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          tahun: number;
          kategori: KategoriRisikoBlud;
          deskripsi: string;
          tingkat: TingkatRisiko;
          mitigasi?: string | null;
          status?: StatusTindakLanjut;
        };
        Update: Partial<{
          tahun: number;
          kategori: KategoriRisikoBlud;
          deskripsi: string;
          tingkat: TingkatRisiko;
          mitigasi: string | null;
          status: StatusTindakLanjut;
        }>;
        Relationships: [];
      };

      blud_kepatuhan: {
        Row: {
          id: string;
          blud_id: string;
          tahun: number;
          jenis: JenisKepatuhanBlud;
          status: StatusKepatuhan;
          tanggal_pemenuhan: string | null;
          keterangan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          tahun: number;
          jenis: JenisKepatuhanBlud;
          status?: StatusKepatuhan;
          tanggal_pemenuhan?: string | null;
          keterangan?: string | null;
        };
        Update: Partial<{
          tahun: number;
          jenis: JenisKepatuhanBlud;
          status: StatusKepatuhan;
          tanggal_pemenuhan: string | null;
          keterangan: string | null;
        }>;
        Relationships: [];
      };

      blud_inovasi: {
        Row: {
          id: string;
          blud_id: string;
          tahun: number;
          nama_inovasi: string;
          kategori: KategoriInovasi;
          deskripsi: string | null;
          manfaat: string | null;
          status: StatusInovasi;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          tahun: number;
          nama_inovasi: string;
          kategori: KategoriInovasi;
          deskripsi?: string | null;
          manfaat?: string | null;
          status?: StatusInovasi;
        };
        Update: Partial<{
          tahun: number;
          nama_inovasi: string;
          kategori: KategoriInovasi;
          deskripsi: string | null;
          manfaat: string | null;
          status: StatusInovasi;
        }>;
        Relationships: [];
      };

      blud_tindak_lanjut: {
        Row: {
          id: string;
          blud_id: string;
          tahun: number;
          sumber: SumberRekomendasi;
          rekomendasi: string;
          rencana_tindak_lanjut: string | null;
          persentase_penyelesaian: number;
          bukti_dukung_url: string | null;
          target_penyelesaian: string | null;
          status: StatusTindakLanjut;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          tahun: number;
          sumber: SumberRekomendasi;
          rekomendasi: string;
          rencana_tindak_lanjut?: string | null;
          persentase_penyelesaian?: number;
          bukti_dukung_url?: string | null;
          target_penyelesaian?: string | null;
          status?: StatusTindakLanjut;
        };
        Update: Partial<{
          rekomendasi: string;
          rencana_tindak_lanjut: string | null;
          persentase_penyelesaian: number;
          bukti_dukung_url: string | null;
          target_penyelesaian: string | null;
          status: StatusTindakLanjut;
        }>;
        Relationships: [];
      };

      konfigurasi_bobot: {
        Row: {
          id: string;
          jenis_entitas: EntityType;
          nama_indikator: string;
          bobot: number;
          berlaku_sejak: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          jenis_entitas: EntityType;
          nama_indikator: string;
          bobot: number;
          berlaku_sejak?: string;
        };
        Update: Partial<{
          jenis_entitas: EntityType;
          nama_indikator: string;
          bobot: number;
          berlaku_sejak: string;
        }>;
        Relationships: [];
      };

      evaluasi_bumd: {
        Row: {
          id: string;
          bumd_id: string;
          periode: string;
          skor_total: number | null;
          kategori: string | null;
          status: string;
          catatan_pembinaan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bumd_id: string;
          periode: string;
          skor_total?: number | null;
          kategori?: string | null;
          status?: string;
          catatan_pembinaan?: string | null;
        };
        Update: Partial<{
          periode: string;
          skor_total: number | null;
          kategori: string | null;
          status: string;
          catatan_pembinaan: string | null;
        }>;
        Relationships: [];
      };

      evaluasi_blud: {
        Row: {
          id: string;
          blud_id: string;
          periode: string;
          skor_total: number | null;
          maturitas: string | null;
          status: string;
          catatan_pembinaan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blud_id: string;
          periode: string;
          skor_total?: number | null;
          maturitas?: string | null;
          status?: string;
          catatan_pembinaan?: string | null;
        };
        Update: Partial<{
          periode: string;
          skor_total: number | null;
          maturitas: string | null;
          status: string;
          catatan_pembinaan: string | null;
        }>;
        Relationships: [];
      };

      evaluasi_indikator: {
        Row: {
          id: string;
          evaluasi_bumd_id: string | null;
          evaluasi_blud_id: string | null;
          konfigurasi_bobot_id: string;
          nilai: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          evaluasi_bumd_id?: string | null;
          evaluasi_blud_id?: string | null;
          konfigurasi_bobot_id: string;
          nilai: number;
        };
        Update: Partial<{
          evaluasi_bumd_id: string | null;
          evaluasi_blud_id: string | null;
          konfigurasi_bobot_id: string;
          nilai: number;
        }>;
        Relationships: [];
      };

      peserta_seleksi: {
        Row: {
          id: string;
          user_id: string;
          jenis_seleksi: JenisSeleksi;
          jalur_pendaftaran: JalurPendaftaran;
          difasilitasi_oleh: string | null;
          bumd_blud_id: string | null;
          token_undangan: string | null;
          status: StatusSeleksi;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          jenis_seleksi: JenisSeleksi;
          jalur_pendaftaran?: JalurPendaftaran;
          difasilitasi_oleh?: string | null;
          bumd_blud_id?: string | null;
          token_undangan?: string | null;
          status?: StatusSeleksi;
        };
        Update: Partial<{
          jenis_seleksi: JenisSeleksi;
          jalur_pendaftaran: JalurPendaftaran;
          difasilitasi_oleh: string | null;
          bumd_blud_id: string | null;
          token_undangan: string | null;
          status: StatusSeleksi;
        }>;
        Relationships: [];
      };

      berkas: {
        Row: {
          id: string;
          peserta_id: string;
          jenis_dokumen: string;
          file_path: string;
          status_verifikasi: string;
          catatan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          peserta_id: string;
          jenis_dokumen: string;
          file_path: string;
          status_verifikasi?: string;
          catatan?: string | null;
        };
        Update: Partial<{
          jenis_dokumen: string;
          file_path: string;
          status_verifikasi: string;
          catatan: string | null;
        }>;
        Relationships: [];
      };

      nilai_ukk: {
        Row: {
          id: string;
          peserta_id: string;
          tim_ukk_id: string;
          tahap: TahapPenilaian;
          skor: number;
          is_final: boolean;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          peserta_id: string;
          tim_ukk_id: string;
          tahap: TahapPenilaian;
          skor: number;
          is_final?: boolean;
          submitted_at?: string | null;
        };
        Update: Partial<{
          tahap: TahapPenilaian;
          skor: number;
          is_final: boolean;
          submitted_at: string | null;
        }>;
        Relationships: [];
      };

      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          aksi: string;
          tabel_terkait: string | null;
          record_id: string | null;
          detail: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          aksi: string;
          tabel_terkait?: string | null;
          record_id?: string | null;
          detail?: Record<string, unknown> | null;
        };
        Update: never;
        Relationships: [];
      };

      dokumen_internal: {
        Row: {
          id: string;
          pembuat_id: string;
          judul: string;
          file_path: string | null;
          status: StatusDokumen;
          versi: number;
          approver_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pembuat_id: string;
          judul: string;
          file_path?: string | null;
          status?: StatusDokumen;
          versi?: number;
          approver_id?: string | null;
        };
        Update: Partial<{
          judul: string;
          file_path: string | null;
          status: StatusDokumen;
          versi: number;
          approver_id: string | null;
        }>;
        Relationships: [];
      };

      knowledge_base: {
        Row: {
          id: string;
          judul: string;
          kategori: string;
          file_path: string | null;
          embedding: number[] | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          judul: string;
          kategori: string;
          file_path?: string | null;
          embedding?: number[] | null;
          is_public?: boolean;
        };
        Update: Partial<{
          judul: string;
          kategori: string;
          file_path: string | null;
          embedding: number[] | null;
          is_public: boolean;
        }>;
        Relationships: [];
      };
    };

    Views: {
      v_blud_capaian: {
        Row: {
          realisasi_id: string;
          blud_kpi_id: string;
          blud_id: string;
          tahun: number;
          kategori: KategoriIkuBlud;
          nama_indikator: string;
          target_nilai: number;
          jenis_periode: JenisPeriodeBlud;
          nomor_periode: number;
          nilai_realisasi: number;
          status_verifikasi: StatusVerifikasiBlud;
          persentase_capaian: number | null;
        };
        Relationships: [];
      };
    };

    Functions: {
      get_email_by_username: {
        Args: { p_username: string };
        Returns: string | null;
      };
      get_rekap_nilai_ukk: {
        Args: Record<string, never>;
        Returns: {
          peserta_id: string;
          tahap: TahapPenilaian;
          jumlah_penilai_final: number;
          total_tim_ukk_aktif: number;
          skor_rata_rata: number | null;
          sudah_lengkap: boolean;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      entity_type: EntityType;
      jenis_seleksi: JenisSeleksi;
      jalur_pendaftaran: JalurPendaftaran;
      status_seleksi: StatusSeleksi;
      tahap_penilaian: TahapPenilaian;
      status_dokumen: StatusDokumen;
      kategori_iku: KategoriIku;
      jenis_periode_monev: JenisPeriodeMonev;
      tingkat_risiko: TingkatRisiko;
      kategori_risiko: KategoriRisiko;
      status_tindak_lanjut: StatusTindakLanjut;
      jenis_kepatuhan: JenisKepatuhan;
      status_kepatuhan: StatusKepatuhan;
      status_blud_enum: StatusBludEnum;
      kategori_iku_blud: KategoriIkuBlud;
      jenis_periode_blud: JenisPeriodeBlud;
      status_verifikasi_blud: StatusVerifikasiBlud;
      kategori_risiko_blud: KategoriRisikoBlud;
      jenis_kepatuhan_blud: JenisKepatuhanBlud;
      kategori_inovasi: KategoriInovasi;
      status_inovasi: StatusInovasi;
      sumber_rekomendasi: SumberRekomendasi;
    };
    CompositeTypes: Record<string, never>;
  };
};
