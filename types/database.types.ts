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
  | "tim_ukk"
  | "peserta";

export type EntityType = "bumd" | "blud";
export type JenisSeleksi = "direksi" | "dewas" | "komisaris" | "pegawai_blud";
export type JalurPendaftaran = "mandiri" | "assisted";
export type StatusSeleksi =
  | "terdaftar"
  | "administrasi"
  | "lolos_administrasi"
  | "penilaian"
  | "selesai"
  | "ditolak";
export type TahapPenilaian =
  | "psikotes"
  | "tes_tulis"
  | "ukk"
  | "presentasi"
  | "wawancara";
export type StatusDokumen = "draft" | "diajukan" | "disetujui" | "ditolak" | "diarsipkan";

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          jenis_usaha?: string | null;
          status?: string;
          profil_singkat?: string | null;
        };
        Update: Partial<{
          nama: string;
          jenis_usaha: string | null;
          status: string;
          profil_singkat: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          jenis_layanan?: string | null;
          status?: string;
          profil_singkat?: string | null;
        };
        Update: Partial<{
          nama: string;
          jenis_layanan: string | null;
          status: string;
          profil_singkat: string | null;
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
      v_status_penilaian_ukk: {
        Row: {
          peserta_id: string;
          tahap_selesai: number;
          total_tahap_diinput: number;
        };
        Relationships: [];
      };
    };

    Functions: {
      get_email_by_username: {
        Args: { p_username: string };
        Returns: string | null;
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
    };
    CompositeTypes: Record<string, never>;
  };
};
