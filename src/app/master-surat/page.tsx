import { LayoutTemplate } from "lucide-react";

export default function MasterSuratPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
      <LayoutTemplate size={48} className="text-slate-600" />
      <h2 className="text-xl font-bold text-slate-300">Master Surat</h2>
      <p className="text-sm text-slate-500">
        Fitur pembuatan template surat sedang dalam pengembangan.
      </p>
    </div>
  );
}
