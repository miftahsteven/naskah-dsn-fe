"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Archive,
  ArchiveRestore,
  Eye,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  BookOpen,
  Sparkles,
  Tag,
  Clock,
  Filter,
  LayoutGrid,
  List,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import SimpleRichEditor from "@/components/SimpleRichEditor";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "wysiwyg";
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
}

interface LetterTemplate {
  id: string;
  name: string;
  code: string | null;
  category: string;
  description: string | null;
  htmlContent: string;
  variables: TemplateVariable[];
  isArchived: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const categoryColor: Record<string, string> = {
  Pernyataan: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Opini: "bg-blue-50 text-blue-700 border-blue-200",
  Perjanjian: "bg-violet-50 text-violet-700 border-violet-200",
  Rekomendasi: "bg-amber-50 text-amber-700 border-amber-200",
  "Surat Internal": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Surat Keputusan": "bg-orange-50 text-orange-700 border-orange-200",
  "Surat Mandat": "bg-rose-50 text-rose-700 border-rose-200",
  "Surat Tugas": "bg-teal-50 text-teal-700 border-teal-200",
  Lainnya: "bg-slate-100 text-slate-600 border-slate-200",
};
const getCategoryStyle = (cat: string) =>
  categoryColor[cat] ?? categoryColor["Lainnya"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all",
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      )}
    >
      {type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={15} />
      </button>
    </div>
  );
}

// ── Variable Builder ──────────────────────────────────────────────────────────
function VariableRow({
  v,
  idx,
  onChange,
  onRemove,
}: {
  v: TemplateVariable;
  idx: number;
  onChange: (idx: number, field: keyof TemplateVariable, val: any) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start border border-slate-200 rounded-lg p-3 bg-slate-50 group">
      <div className="col-span-3">
        <input
          className="w-full border rounded-md px-2 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#006633] outline-none"
          placeholder="key (e.g. nomorSurat)"
          value={v.key}
          onChange={(e) => onChange(idx, "key", e.target.value)}
        />
      </div>
      <div className="col-span-3">
        <input
          className="w-full border rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#006633] outline-none"
          placeholder="Label"
          value={v.label}
          onChange={(e) => onChange(idx, "label", e.target.value)}
        />
      </div>
      <div className="col-span-2">
        <select
          className="w-full border rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#006633] outline-none bg-white"
          value={v.type}
          onChange={(e) => onChange(idx, "type", e.target.value)}
        >
          <option value="text">Text</option>
          <option value="textarea">Textarea</option>
          <option value="wysiwyg">WYSIWYG / Rich Text</option>
          <option value="date">Tanggal</option>
        </select>
      </div>
      <div className="col-span-2 flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          checked={v.required}
          onChange={(e) => onChange(idx, "required", e.target.checked)}
          className="accent-[#006633]"
          id={`req-${idx}`}
        />
        <label htmlFor={`req-${idx}`} className="text-xs text-slate-600">
          Wajib
        </label>
      </div>
      <div className="col-span-1 flex justify-end pt-1">
        <button
          onClick={() => onRemove(idx)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
      <div className="col-span-11">
        <input
          className="w-full border rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#006633] outline-none bg-white"
          placeholder="Placeholder (opsional)"
          value={v.placeholder || ""}
          onChange={(e) => onChange(idx, "placeholder", e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Form Modal (Create / Edit) ────────────────────────────────────────────────
function TemplateFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: LetterTemplate | null;
  onClose: () => void;
  onSaved: (t: LetterTemplate) => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Pernyataan");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [htmlContent, setHtmlContent] = useState(initial?.htmlContent ?? "");
  const [variables, setVariables] = useState<TemplateVariable[]>(
    initial?.variables ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "html" | "variables">("info");

  const addVar = () =>
    setVariables([
      ...variables,
      { key: "", label: "", type: "text", required: true, placeholder: "" },
    ]);

  const removeVar = (idx: number) =>
    setVariables(variables.filter((_, i) => i !== idx));

  const changeVar = (idx: number, field: keyof TemplateVariable, val: any) => {
    const next = [...variables];
    next[idx] = { ...next[idx], [field]: val };
    setVariables(next);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category || !htmlContent.trim()) {
      setError("Nama, kategori, dan konten HTML wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = { name, code: code || null, category, description, htmlContent, variables };
      let res;
      if (isEdit) {
        res = await api.patch(`/letter-templates/${initial!.id}`, payload);
      } else {
        res = await api.post("/letter-templates", payload);
      }
      onSaved(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan template.");
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = ["Pernyataan", "Opini", "Perjanjian", "Rekomendasi", "Surat Internal", "Surat Keputusan", "Surat Mandat", "Surat Tugas", "Lainnya"];

  const placeholderHtml = `<div style="font-family: Arial; font-size: 12pt; padding: 40px;">
  <h2>NAMA LEMBAGA</h2>
  <p>Nomor: <strong>{{nomorSurat}}</strong></p>
  <p>Kepada Yth. <strong>{{namaPenerima}}</strong></p>
  <p>Isi surat: {{isiSurat}}</p>
</div>`;

  // detect variables from HTML
  const detectVarsFromHtml = () => {
    const matches = htmlContent.match(/\{\{(\w+)\}\}/g) || [];
    const keys = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
    const existing = new Set(variables.map((v) => v.key));
    const newVars: TemplateVariable[] = keys
      .filter((k) => !existing.has(k))
      .map((k) => ({ key: k, label: k, type: "text", required: true, placeholder: "" }));
    if (newVars.length > 0) setVariables([...variables, ...newVars]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#006633]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#006633]/10 flex items-center justify-center">
              {isEdit ? <Pencil size={18} className="text-[#006633]" /> : <Plus size={18} className="text-[#006633]" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                {isEdit ? "Edit Template Surat" : "Buat Template Baru"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan <code className="bg-slate-100 px-1 rounded">{"{{namaVariabel}}"}</code> sebagai placeholder dinamis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-slate-50">
          {(["info", "html", "variables"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-[#006633] text-[#006633] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "info" && "Informasi"}
              {tab === "html" && "Konten HTML"}
              {tab === "variables" && `Variabel (${variables.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nama Template <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633] outline-none transition"
                    placeholder="e.g. Pernyataan Kesesuaian Syariah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Template</label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633] outline-none transition"
                    placeholder="e.g. PKS-SYARIAH (unik, opsional)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border font-medium transition-all",
                        category === c
                          ? "bg-[#006633] text-white border-[#006633]"
                          : "bg-white text-slate-600 border-slate-300 hover:border-[#006633]/50"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633] outline-none transition resize-none"
                  placeholder="Deskripsi singkat tentang penggunaan template ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* HTML Tab */}
          {activeTab === "html" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Tulis template HTML. Gunakan{" "}
                  <code className="bg-slate-100 text-[#006633] px-1.5 py-0.5 rounded font-mono text-xs">{"{{key}}"}</code>{" "}
                  untuk placeholder yang akan diganti saat membuat surat.
                </p>
                <button
                  onClick={detectVarsFromHtml}
                  className="text-xs text-[#006633] hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} /> Deteksi variabel dari HTML
                </button>
              </div>
              <textarea
                rows={20}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633] outline-none transition resize-none bg-slate-950 text-emerald-300 leading-relaxed"
                placeholder={placeholderHtml}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Variables Tab */}
          {activeTab === "variables" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Definisi Variabel</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan setiap variabel yang digunakan dalam template HTML di atas.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={detectVarsFromHtml}
                    className="flex items-center gap-1.5 text-xs text-[#006633] border border-[#006633]/30 px-3 py-1.5 rounded-lg hover:bg-[#006633]/5 transition"
                  >
                    <Sparkles size={12} /> Auto-detect
                  </button>
                  <button
                    onClick={addVar}
                    className="flex items-center gap-1.5 text-xs text-white bg-[#006633] px-3 py-1.5 rounded-lg hover:bg-[#004d26] transition"
                  >
                    <Plus size={12} /> Tambah
                  </button>
                </div>
              </div>

              {variables.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Tag size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada variabel.</p>
                  <p className="text-xs mt-1">Tambah manual atau klik "Auto-detect" dari tab HTML.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-3">
                    <div className="col-span-3">Key</div>
                    <div className="col-span-3">Label</div>
                    <div className="col-span-2">Tipe</div>
                    <div className="col-span-2">Wajib</div>
                    <div className="col-span-2" />
                  </div>
                  {variables.map((v, idx) => (
                    <VariableRow key={idx} v={v} idx={idx} onChange={changeVar} onRemove={removeVar} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
          <p className="text-xs text-slate-400">
            {variables.length} variabel terdefinisi
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm text-white bg-[#006633] rounded-xl hover:bg-[#004d26] disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Buat Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({
  template,
  onClose,
}: {
  template: LetterTemplate;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(template.variables.map((v) => [v.key, v.placeholder || ""]))
  );
  const [showForm, setShowForm] = useState(true);

  const compiledHtml = template.htmlContent.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => values[key] || `<span style="background:#fef3c7;padding:0 2px;">{{${key}}}</span>`
  );

  const handleDownloadHtml = () => {
    const blob = new Blob([compiledHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#006633]/5 to-transparent flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-800">{template.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Preview Surat — Isi variabel untuk melihat hasil akhir</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm((p) => !p)}
              className="text-xs text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              {showForm ? "Sembunyikan Form" : "Tampilkan Form"}
            </button>
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 text-xs text-white bg-[#006633] px-3 py-1.5 rounded-lg hover:bg-[#004d26] transition"
            >
              <Download size={13} /> Unduh HTML
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Variables form */}
          {showForm && (
            <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-5 space-y-4 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Tag size={14} className="text-[#006633]" /> Isi Variabel Surat
              </p>
              {template.variables.map((v) => (
                <div key={v.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {v.label}
                    {v.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {v.type === "wysiwyg" || v.key === "agendaDetail" || v.key === "daftarUndangan" || v.key === "keteranganNarahubung" || v.key === "keterangan" ? (
                    <SimpleRichEditor
                      value={values[v.key] || ""}
                      placeholder={v.placeholder || `Isi ${v.label}`}
                      onChange={(val) => setValues({ ...values, [v.key]: val })}
                    />
                  ) : v.type === "textarea" ? (
                    <textarea
                      rows={3}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#006633] outline-none bg-white resize-none"
                      placeholder={v.placeholder || `Isi ${v.label}`}
                      value={values[v.key] || ""}
                      onChange={(e) => setValues({ ...values, [v.key]: e.target.value })}
                    />
                  ) : v.type === "date" ? (
                    <input
                      type="date"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#006633] outline-none bg-white"
                      value={values[v.key] || ""}
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        const formatted = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                        setValues({ ...values, [v.key]: formatted });
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#006633] outline-none bg-white"
                      placeholder={v.placeholder || `Isi ${v.label}`}
                      value={values[v.key] || ""}
                      onChange={(e) => setValues({ ...values, [v.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview iframe */}
          <div className="flex-1 overflow-auto bg-slate-100 p-6">
            <div className="bg-white shadow-lg rounded-xl min-h-full overflow-hidden">
              <iframe
                srcDoc={compiledHtml}
                className="w-full min-h-[800px] border-0 rounded-xl"
                title="preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onEdit,
  onPreview,
  onArchive,
  onRestore,
}: {
  template: LetterTemplate;
  onEdit: () => void;
  onPreview: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group overflow-hidden",
        template.isArchived
          ? "border-slate-200 opacity-70"
          : "border-slate-200 hover:border-[#006633]/30"
      )}
    >
      {/* top accent */}
      <div
        className={cn(
          "h-1 w-full",
          template.isArchived ? "bg-slate-300" : "bg-gradient-to-r from-[#006633] to-[#009944]"
        )}
      />

      <div className="p-5">
        {/* Badge row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full border",
              template.isArchived ? "bg-slate-100 text-slate-500 border-slate-200" : getCategoryStyle(template.category)
            )}
          >
            {template.category}
          </span>
          {template.isArchived && (
            <span className="text-xs text-slate-400 border border-dashed border-slate-300 px-2 py-0.5 rounded-full">
              Diarsipkan
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-slate-800 leading-snug mb-1 text-sm">
          {template.name}
        </h3>
        {template.code && (
          <p className="text-[11px] font-mono text-slate-400 mb-2">{template.code}</p>
        )}
        {template.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {template.description}
          </p>
        )}

        {/* Variable count */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Tag size={11} />
            {template.variables.length} variabel
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDate(template.updatedAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!template.isArchived && (
            <button
              onClick={onPreview}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[#006633] border border-[#006633]/30 py-2 rounded-xl hover:bg-[#006633]/5 transition font-medium"
            >
              <Eye size={13} /> Preview
            </button>
          )}
          {!template.isArchived && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-700 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition font-medium"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          {template.isArchived ? (
            <button
              onClick={onRestore}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-emerald-700 border border-emerald-200 py-2 rounded-xl hover:bg-emerald-50 transition font-medium"
            >
              <ArchiveRestore size={13} /> Pulihkan
            </button>
          ) : (
            <button
              onClick={onArchive}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-200 transition"
              title="Arsipkan template"
            >
              <Archive size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TemplateSuratPage() {
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LetterTemplate | null>(null);
  const [previewTarget, setPreviewTarget] = useState<LetterTemplate | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (showArchived) params.includeArchived = "true";
      const res = await api.get("/letter-templates", { params });
      setTemplates(res.data.data);
    } catch {
      showToast("Gagal memuat template.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showArchived]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post("/letter-templates/seed");
      showToast("Template default berhasil ditambahkan!");
      fetchTemplates();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Gagal seeding template.", "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleSaved = (t: LetterTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = t;
        return next;
      }
      return [t, ...prev];
    });
    setFormOpen(false);
    setEditTarget(null);
    showToast(editTarget ? "Template berhasil diperbarui!" : "Template berhasil dibuat!");
  };

  const handleArchive = async (id: string) => {
    try {
      await api.patch(`/letter-templates/${id}/archive`);
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, isArchived: true } : t)));
      showToast("Template diarsipkan.");
    } catch {
      showToast("Gagal mengarsipkan template.", "error");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/letter-templates/${id}/restore`);
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, isArchived: false } : t)));
      showToast("Template dipulihkan!");
    } catch {
      showToast("Gagal memulihkan template.", "error");
    }
  };

  const CATEGORIES = ["Pernyataan", "Opini", "Perjanjian", "Rekomendasi", "Surat Internal", "Surat Keputusan", "Surat Mandat", "Surat Tugas", "Lainnya"];

  const displayed = showArchived
    ? templates
    : templates.filter((t) => !t.isArchived);

  const activeCount = templates.filter((t) => !t.isArchived).length;
  const archivedCount = templates.filter((t) => t.isArchived).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006633] to-[#009944] flex items-center justify-center shadow-lg shadow-[#006633]/20">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Template Surat</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Kelola template surat DSN-MUI yang dapat digunakan ulang
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 text-sm text-[#006633] border border-[#006633]/30 px-4 py-2 rounded-xl hover:bg-[#006633]/5 transition disabled:opacity-50"
            >
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Template Default
            </button>
            <button
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              className="flex items-center gap-2 text-sm text-white bg-[#006633] px-4 py-2 rounded-xl hover:bg-[#004d26] shadow-lg shadow-[#006633]/20 transition"
            >
              <Plus size={16} /> Buat Template
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Template", value: templates.length, color: "text-slate-700", bg: "bg-slate-100" },
            { label: "Aktif", value: activeCount, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Diarsipkan", value: archivedCount, color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Kategori", value: [...new Set(templates.map((t) => t.category))].length, color: "text-blue-700", bg: "bg-blue-50" },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-2xl p-4", s.bg)}>
              <p className="text-2xl font-bold mb-0.5" style={{ color: s.color.replace("text-", "") }}>{s.value}</p>
              <p className={cn("text-xs font-medium", s.color)}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] outline-none bg-white transition"
                placeholder="Cari template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCategoryFilter("")}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium border transition",
                  !categoryFilter ? "bg-[#006633] text-white border-[#006633]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                Semua
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c === categoryFilter ? "" : c)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-medium border transition",
                    categoryFilter === c
                      ? "bg-[#006633] text-white border-[#006633]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show archived toggle */}
            <button
              onClick={() => setShowArchived((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition",
                showArchived
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              <Archive size={13} />
              {showArchived ? "Sembunyikan Arsip" : "Tampilkan Arsip"}
            </button>

            {/* View mode toggle */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 transition", viewMode === "grid" ? "bg-[#006633] text-white" : "bg-white text-slate-500 hover:bg-slate-50")}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 transition", viewMode === "list" ? "bg-[#006633] text-white" : "bg-white text-slate-500 hover:bg-slate-50")}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#006633]" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText size={36} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum ada template</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Klik <strong>"Template Default"</strong> untuk memuat template bawaan DSN-MUI, atau buat template baru dari awal.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 text-sm text-[#006633] border border-[#006633]/30 px-5 py-2.5 rounded-xl hover:bg-[#006633]/5 transition"
              >
                {seeding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Muat Template Default
              </button>
              <button
                onClick={() => { setEditTarget(null); setFormOpen(true); }}
                className="flex items-center gap-2 text-sm text-white bg-[#006633] px-5 py-2.5 rounded-xl hover:bg-[#004d26] transition"
              >
                <Plus size={14} /> Buat dari Awal
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => { setEditTarget(t); setFormOpen(true); }}
                onPreview={() => setPreviewTarget(t)}
                onArchive={() => handleArchive(t.id)}
                onRestore={() => handleRestore(t.id)}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {displayed.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-4 hover:border-[#006633]/30 hover:shadow-md transition group",
                  t.isArchived && "opacity-60"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", t.isArchived ? "bg-slate-100" : "bg-[#006633]/10")}>
                  <FileText size={18} className={t.isArchived ? "text-slate-400" : "text-[#006633]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm truncate">{t.name}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0", getCategoryStyle(t.category))}>
                      {t.category}
                    </span>
                    {t.isArchived && <span className="text-[10px] text-slate-400 border border-dashed px-2 py-0.5 rounded-full">Arsip</span>}
                  </div>
                  {t.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{t.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-0.5"><Tag size={10} /> {t.variables.length} variabel</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} /> {formatDate(t.updatedAt)}</span>
                    {t.code && <span className="font-mono">{t.code}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!t.isArchived && (
                    <>
                      <button onClick={() => setPreviewTarget(t)} className="text-xs text-[#006633] border border-[#006633]/30 px-3 py-1.5 rounded-lg hover:bg-[#006633]/5 transition flex items-center gap-1">
                        <Eye size={12} /> Preview
                      </button>
                      <button onClick={() => { setEditTarget(t); setFormOpen(true); }} className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition flex items-center gap-1">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleArchive(t.id)} className="text-xs text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition flex items-center gap-1">
                        <Archive size={12} /> Arsipkan
                      </button>
                    </>
                  )}
                  {t.isArchived && (
                    <button onClick={() => handleRestore(t.id)} className="text-xs text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition flex items-center gap-1">
                      <ArchiveRestore size={12} /> Pulihkan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {formOpen && (
        <TemplateFormModal
          initial={editTarget}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {previewTarget && (
        <PreviewModal template={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
