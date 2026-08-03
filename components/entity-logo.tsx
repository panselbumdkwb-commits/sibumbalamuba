import Image from "next/image";
import { ENTITY_LOGOS } from "@/lib/entity-logos";

export default function EntityLogo({ nama }: { nama: string }) {
  const src = ENTITY_LOGOS[nama];

  if (src) {
    return (
      <div className="h-12 w-12 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
        <Image src={src} alt={`Logo ${nama}`} width={48} height={48} className="object-contain h-9 w-9" />
      </div>
    );
  }

  const initial = nama.trim().charAt(0).toUpperCase();
  return (
    <div className="h-12 w-12 shrink-0 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center">
      <span className="text-primary-800 font-semibold text-sm">{initial}</span>
    </div>
  );
}
