"use client";

export default function CetakButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary">
      🖨️ Cetak / Simpan sebagai PDF
    </button>
  );
}
