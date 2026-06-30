const fs = require('fs');
const filePath = 'src/app/surat-masuk/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const modalComponent = `
// ── Document Detail Modal (Centralized) ──────────────────────────────────
const DocumentDetailModal = ({
  sidebarDoc,
  onClose,
  setReaderDoc,
  setIsRevisionModalOpen,
  setIsApprovalModalOpen,
  setIsWorkflowEditModalOpen,
}: {
  sidebarDoc: any;
  onClose: () => void;
  setReaderDoc: (doc: { title: string, fileUrl: string }) => void;
  setIsRevisionModalOpen: (val: boolean) => void;
  setIsApprovalModalOpen: (val: boolean) => void;
  setIsWorkflowEditModalOpen: (val: boolean) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'evidence' | 'agenda'>('detail');
  const [selectedDate, setSelectedDate] = useState<string>('');

  if (!sidebarDoc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-[24px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006633]/10 text-[#006633] flex items-center justify-center shrink-0">
              <FileBadge size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">Detail Surat Masuk</h3>
              <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{sidebarDoc.documentNumber || "No Nomor"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Layout Body */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0 p-4 space-y-1 overflow-x-auto flex md:flex-col">
            <button
              onClick={() => setActiveTab('detail')}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'detail' ? "bg-[#006633] text-white shadow-md shadow-[#006633]/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}
            >
              <Info size={18} /> Informasi & Alur
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'evidence' ? "bg-[#006633] text-white shadow-md shadow-[#006633]/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}
            >
              <Paperclip size={18} /> Dokumen Lampiran
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'agenda' ? "bg-[#006633] text-white shadow-md shadow-[#006633]/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}
            >
              <Calendar size={18} /> Agenda Rapat
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">
            {activeTab === 'detail' && (
              <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
                {/* Title & Category */}
                <div>
                  <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wide mr-2", statusClass(sidebarDoc.status))}>
                    {sidebarDoc.status}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">{sidebarDoc.category?.name}</span>
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug mt-3">{sidebarDoc.title}</h3>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5">
                  {sidebarDoc.versions?.[sidebarDoc.versions.length - 1] && (
                    <button
                      onClick={() => setReaderDoc({
                        title: sidebarDoc.versions[sidebarDoc.versions.length - 1].fileName,
                        fileUrl: sidebarDoc.versions[sidebarDoc.versions.length - 1].fileUrl
                      })}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#006633] text-white font-bold rounded-xl text-xs hover:bg-[#006633]/90 active:scale-[0.97] transition-all shadow-sm shadow-[#006633]/10"
                    >
                      <Eye size={14} /> Lihat Surat Utama
                    </button>
                  )}
                  {sidebarDoc.status === 'REVISION' && (
                    <button
                      onClick={() => setIsRevisionModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
                    >
                      <FileUp size={14} /> Kirim Revisi
                    </button>
                  )}
                  {sidebarDoc.status === 'DRAFT' && (
                    <button
                      onClick={() => setIsApprovalModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm"
                    >
                      <Play size={14} /> Mulai Workflow
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Workflow Stepper Timeline */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#006633]" /> Alur Persetujuan
                      </h4>
                      {sidebarDoc.workflowInstances && sidebarDoc.workflowInstances.length > 0 &&
                        !['COMPLETED', 'REJECTED'].includes(sidebarDoc.workflowInstances[sidebarDoc.workflowInstances.length - 1].status) && (
                          <button
                            onClick={() => setIsWorkflowEditModalOpen(true)}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline"
                          >
                            Ubah Alur
                          </button>
                        )}
                    </div>

                    {sidebarDoc.workflowInstances && sidebarDoc.workflowInstances.length > 0 ? (
                      <div className="relative pl-5 space-y-5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800/80">
                        {sidebarDoc.workflowInstances[sidebarDoc.workflowInstances.length - 1].steps
                          .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
                          .map((step: any) => {
                            const isApproved = step.status === 'APPROVED';
                            const isPending = step.status === 'PENDING';
                            const isRejected = step.status === 'REJECTED';
                            return (
                              <div key={step.id} className="relative">
                                <div className={cn(
                                  "absolute -left-[25px] top-0.5 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-sm transition-all",
                                  isApproved ? "bg-emerald-500 text-white" :
                                    isPending ? "bg-amber-400 text-white animate-pulse" :
                                      isRejected ? "bg-red-500 text-white" :
                                        "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                                )}>
                                  {isApproved ? <CheckCircle2 size={12} /> :
                                    isPending ? <Clock size={12} /> :
                                      isRejected ? <X size={12} /> :
                                        <span className="text-[8px] font-bold">{step.stepNumber}</span>}
                                </div>
                                <div className="text-xs leading-relaxed">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{step.user?.fullName || "User"}</p>
                                    <span className={cn(
                                      "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border",
                                      isApproved ? "text-emerald-600 bg-emerald-50/50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/10 dark:border-emerald-900/50" :
                                        isPending ? "text-amber-600 bg-amber-50/50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/10 dark:border-amber-900/50" :
                                          isRejected ? "text-red-600 bg-red-50/50 border-red-100 dark:text-red-400 dark:bg-red-950/10 dark:border-red-900/50" :
                                            "text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700/60"
                                    )}>
                                      {step.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium">{step.user?.jobTitle || "Penandatangan"}</p>
                                  {step.comment && (
                                    <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                                      <span className="text-[#D4AF37] font-serif font-black text-base mr-1 leading-none">&ldquo;</span>
                                      <span className="italic">{step.comment}</span>
                                      <span className="text-[#D4AF37] font-serif font-black text-base ml-1 leading-none">&rdquo;</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-2">Belum ada alur workflow yang disubmit.</p>
                    )}
                  </div>

                  {/* Riwayat Versi & Informasi Surat */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={14} className="text-[#006633]" /> Riwayat Versi Surat
                        </h4>
                        {sidebarDoc.status !== 'SIGNED' && (
                          <button
                            onClick={() => setIsRevisionModalOpen(true)}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            Unggah Versi Baru
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {sidebarDoc.versions?.map((v: any) => (
                          <div key={v.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 group hover:border-[#006633]/20 dark:hover:border-[#006633]/30 transition-all">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-extrabold text-[#006633] bg-[#006633]/8 px-1.5 py-0.5 rounded">v{v.versionNum}</span>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={v.fileName}>{v.fileName}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{(v.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setReaderDoc({ title: v.fileName, fileUrl: v.fileUrl })}
                                className="p-2 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
                                title="Lihat"
                              >
                                <Eye size={14} />
                              </button>
                              <a
                                href={\`http://localhost:4002/\${v.fileUrl}\`}
                                download={v.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 rounded-lg transition-colors flex items-center justify-center"
                                title="Unduh"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                        Informasi Metadata
                      </h4>
                      <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-400">Nomor</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">{sidebarDoc.documentNumber || "—"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-400">Tanggal Masuk</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{new Date(sidebarDoc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-400">Sifat/Klasifikasi</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{sidebarDoc.classification?.name || "—"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-400">Pembuat</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[200px]">{sidebarDoc.creator?.fullName}</span>
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                          <span className="text-slate-400">Keterangan Catatan Tambahan</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/10 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50 mt-1">{sidebarDoc.versions?.[0]?.changeNotes || "Tidak ada keterangan tambahan."}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Paperclip className="text-[#006633]" size={20} /> Dokumen Lampiran (Evidence)
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload dan kelola dokumen pendukung selama proses pembahasan surat berjalan.</p>
                </div>

                {/* Upload Area */}
                <div className="mb-8 relative group">
                  <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-6 py-10 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-[#006633]/50 group-hover:bg-[#006633]/5 transition-all">
                    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-[#006633] transition-colors">
                      <UploadCloud size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Klik atau drag & drop file ke sini</p>
                      <p className="text-xs text-slate-500 mt-1">Mendukung format PDF, JPG, PNG (Max. 10MB)</p>
                    </div>
                  </div>
                </div>

                {/* Mock List of Evidences */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Riwayat Lampiran</h4>
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#006633]/30 transition-all group shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <File size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#006633] transition-colors">Hasil_Kajian_Tahap_{i}.pdf</p>
                          <p className="text-xs text-slate-500 mt-0.5">Diunggah oleh DSN Admin • {new Date().toLocaleDateString('id-ID')} 10:{i}0 WIB</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-[#006633] hover:bg-[#006633]/10 rounded-xl transition-all" title="Lihat">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Hapus">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="text-[#006633]" size={20} /> Agenda Rapat Pembahasan
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Jadwalkan atau tambahkan surat ini ke dalam agenda rapat yang sudah ada.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Date Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Tanggal Rapat</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none ring-2 ring-transparent focus:ring-[#006633]/20 transition-all font-medium text-slate-700 dark:text-slate-300 cursor-pointer" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    
                    {!selectedDate ? (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 mt-4">
                        <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">Pilih tanggal di atas untuk melihat atau membuat agenda rapat.</p>
                      </div>
                    ) : (
                      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button className="w-full py-4 border-2 border-dashed border-[#006633]/30 text-[#006633] font-bold rounded-2xl hover:bg-[#006633]/5 hover:border-[#006633]/50 transition-all flex items-center justify-center gap-2">
                          <Plus size={18} /> Buat Agenda Rapat Baru
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Existing Agendas on Selected Date */}
                  {selectedDate && (
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Agenda Tersedia ({new Date(selectedDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})})
                      </label>
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#006633]/40 hover:shadow-md transition-all bg-white dark:bg-slate-900 group">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#006633] transition-colors">Rapat Pleno DSN-MUI ke-{120 + i}</h4>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Clock size={12} /> 09:00 - 12:00 WIB</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50">Draft</span>
                            </div>
                            <button className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-[#006633] hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-transparent">
                              <Plus size={14} /> Tambahkan Surat ke Agenda Ini
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`;

const sidebarDrawerPattern = /\{\/\* Backdrop for Sidebar drawer \*\/\}[\s\S]*?(?=\{\/\* Modals placed optimally outside layout flows \*\/})/m;

const modalInvocation = `      {selectedDocId && sidebarDoc && (
        <DocumentDetailModal
          sidebarDoc={sidebarDoc}
          onClose={() => setSelectedDocId(null)}
          setReaderDoc={setReaderDoc}
          setIsRevisionModalOpen={setIsRevisionModalOpen}
          setIsApprovalModalOpen={setIsApprovalModalOpen}
          setIsWorkflowEditModalOpen={setIsWorkflowEditModalOpen}
        />
      )}

      `;

let newContent = content.replace("const DocumentsPage = () => {", modalComponent + "\n\nconst DocumentsPage = () => {");
newContent = newContent.replace(sidebarDrawerPattern, modalInvocation);

fs.writeFileSync(filePath, newContent);
