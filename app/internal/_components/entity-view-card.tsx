import EntityLogo from "@/components/entity-logo";

export default function EntityViewCard({
  entity,
  subtitleField,
}: {
  entity: {
    id: string;
    nama: string;
    status: string;
    profil_singkat: string | null;
    [key: string]: string | null;
  };
  subtitleField: string;
}) {
  return (
    <div className="card p-5 flex gap-4">
      <EntityLogo nama={entity.nama} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-slate-900">{entity.nama}</p>
          <span
            className={`badge shrink-0 ${
              entity.status === "aktif" ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {entity.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{entity[subtitleField]}</p>
        {entity.profil_singkat && (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{entity.profil_singkat}</p>
        )}
      </div>
    </div>
  );
}
