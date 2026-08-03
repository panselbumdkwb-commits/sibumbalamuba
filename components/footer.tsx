export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-semibold text-slate-900">SIBUMBALAMUBA</p>
          <p className="text-slate-500 mt-2 leading-relaxed">
            Sistem Informasi BUMD-BLUD Kota Batu. Dikelola oleh Bagian
            Perekonomian dan BPSDA Sekretariat Daerah Kota Batu.
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-900 mb-2">Akses</p>
          <ul className="space-y-1.5 text-slate-500">
            <li><a href="/login/internal" className="hover:text-primary-800">Login Internal Pemda</a></li>
            <li><a href="/login/peserta" className="hover:text-primary-800">Login Peserta Seleksi</a></li>
            <li><a href="/daftar" className="hover:text-primary-800">Daftar Peserta Seleksi</a></li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-slate-900 mb-2">Dasar Regulasi</p>
          <ul className="space-y-1.5 text-slate-500">
            <li>Permendagri No. 37/2018 (Pengelolaan BUMD)</li>
            <li>Permendagri No. 79/2018 (BLUD)</li>
            <li>PP No. 54/2017 (BUMD)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Pemerintah Kota Batu — Data pada halaman
        publik hanya menampilkan informasi yang telah dipublikasikan resmi.
      </div>
    </footer>
  );
}
