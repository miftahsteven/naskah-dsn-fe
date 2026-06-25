import React, { useState, useEffect } from "react";
import { Disposisi } from "../types";
import { X, Paperclip, MoreHorizontal, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface DisposisiDetailProps {
  data: Disposisi | null;
  onClose: () => void;
}

export function DisposisiDetail({ data, onClose }: DisposisiDetailProps) {
  const [activeTab, setActiveTab] = useState<"log_flow" | "lampiran" | "informasi">("log_flow");
  const [logs, setLogs] = useState<any[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data?.id) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [logsRes, wfRes] = await Promise.all([
            api.get(`/disposisi/${data.id}/logs`),
            api.get(`/workflow/document/${data.id}`)
          ]);
          setLogs(logsRes.data.data || []);
          setWorkflowSteps(wfRes.data.data || []);
        } catch (error) {
          console.error("Gagal memuat detail disposisi:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [data?.id]);

  if (!data) return null;

  return (
    <div className="w-[450px] flex-shrink-0 bg-white border-l border-slate-200 h-full flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-slate-500">{data.documentNumber}</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              data.status === "BARU" ? "bg-blue-50 text-blue-600" :
              data.status === "DIPROSES" ? "bg-amber-50 text-amber-600" :
              "bg-emerald-50 text-emerald-600"
            )}>
              {data.status === "BARU" ? "Baru" : data.status === "DIPROSES" ? "Diproses" : "Selesai"}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 leading-tight">
            {data.title}
          </h2>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <Paperclip size={14} />
            <span>{data.attachmentsCount} Lampiran</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Details Grid */}
      <div className="p-5 border-b border-slate-100 grid grid-cols-[100px_1fr] gap-y-3 gap-x-2 text-xs">
        <div className="text-slate-500">Pengirim</div>
        <div className="font-medium text-slate-800">: {data.sender}</div>
        
        <div className="text-slate-500">Tanggal Surat</div>
        <div className="font-medium text-slate-800">: {data.date}</div>
        
        <div className="text-slate-500">Unit Tujuan</div>
        <div className="font-medium text-slate-800">: {data.targetUnit}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-5 pt-2">
        {(["log_flow", "lampiran", "informasi"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-3 text-xs font-semibold capitalize border-b-2 transition-colors",
              activeTab === tab 
                ? "border-[#006633] text-[#006633]" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50">
        {activeTab === "log_flow" && (
          <div className="space-y-6">
            {/* TTE Workflow Status */}
            {workflowSteps.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#006633]" />
                  Status TTE (Alur Persetujuan)
                </h3>
                <div className="space-y-3">
                  {workflowSteps.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {step.status === 'APPROVED' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
                         step.status === 'REJECTED' ? <XCircle size={16} className="text-rose-500" /> :
                         step.status === 'REVISION' ? <RefreshCw size={16} className="text-amber-500" /> :
                         <Clock size={16} className="text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">{step.approver}</div>
                        <div className="text-xs text-slate-500">{step.label}</div>
                        {step.comment && (
                          <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-md italic">
                            "{step.comment}"
                          </div>
                        )}
                        {step.actionedAt && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(step.actionedAt).toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kanban Logs */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Riwayat Pergerakan</h3>
              {isLoading ? (
                <div className="text-xs text-slate-400 text-center py-4">Memuat log...</div>
              ) : logs.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">Belum ada pergerakan disposisi.</div>
              ) : (
                <div className="relative pl-3 border-l-2 border-slate-100 space-y-5">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative">
                      <div className={cn(
                        "absolute -left-[17px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2",
                        index === 0 ? "bg-blue-500 ring-blue-50" : "bg-slate-300 ring-slate-50"
                      )} />
                      
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-medium text-slate-400">
                          {new Date(log.createdAt).toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          {log.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-slate-500">
                          Oleh: {log.user?.fullName || "Sistem"} {log.user?.jobTitle ? `(${log.user.jobTitle})` : ''}
                        </div>
                        {log.description && (
                          <div className="text-xs text-slate-600 mt-1">
                            {log.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "lampiran" && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Paperclip size={32} className="mb-3 opacity-50" />
            <p className="text-sm">Tidak ada lampiran untuk ditampilkan.</p>
          </div>
        )}
        
        {activeTab === "informasi" && (
          <div className="text-sm text-slate-600">
            Informasi tambahan mengenai dokumen disposisi ini.
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="p-4 border-t border-slate-100 flex items-center gap-2 bg-white">
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
          Lihat Surat
        </button>
        
        {data.status === "SELESAI" && (
          <>
            <button className="px-4 py-2 bg-[#006633] text-white rounded-lg text-xs font-semibold hover:bg-[#006633]/90 transition-colors shadow-sm">
              Sebarkan
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Kirim ke client
            </button>
          </>
        )}
        
        <button className="p-2 ml-auto bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
