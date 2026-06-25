import React, { useState, useEffect, useRef } from "react";
import { Disposisi, StatusDisposisi } from "../types";
import { DisposisiCard } from "./DisposisiCard";
import { Plus, MoreVertical, FileDown, Search, GripVertical } from "lucide-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

interface DisposisiKanbanProps {
  cards: Disposisi[];
  onCardClick: (data: Disposisi) => void;
  onDragEnd: (result: any) => void;
  activeCardId?: string;
  availableDocuments: any[];
  onAddDocument: (doc: any) => void;
  onDeleteCard?: (id: string) => void;
}

const columnConfig: { 
  id: StatusDisposisi; 
  label: string; 
  headerBg: string; 
  headerBorder: string;
  headerText: string;
  headerDot: string;
  countBg: string;
  bodyBg: string;
  bodyBorder: string;
  dropHighlight: string;
  accentBar: string;
}[] = [
  { 
    id: "BARU", 
    label: "BARU", 
    headerBg: "bg-blue-50 dark:bg-blue-950/40", 
    headerBorder: "border-blue-200 dark:border-blue-800",
    headerText: "text-blue-700 dark:text-blue-300",
    headerDot: "bg-blue-500",
    countBg: "bg-blue-600 dark:bg-blue-500",
    bodyBg: "bg-blue-50/30 dark:bg-blue-950/10",
    bodyBorder: "border-blue-200/60 dark:border-blue-800/40",
    dropHighlight: "bg-blue-100/60 dark:bg-blue-900/30 ring-2 ring-blue-300 dark:ring-blue-600 ring-inset",
    accentBar: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  { 
    id: "DIPROSES", 
    label: "DIPROSES", 
    headerBg: "bg-amber-50 dark:bg-amber-950/40", 
    headerBorder: "border-amber-200 dark:border-amber-800",
    headerText: "text-amber-700 dark:text-amber-300",
    headerDot: "bg-amber-500",
    countBg: "bg-amber-500 dark:bg-amber-500",
    bodyBg: "bg-amber-50/30 dark:bg-amber-950/10",
    bodyBorder: "border-amber-200/60 dark:border-amber-800/40",
    dropHighlight: "bg-amber-100/60 dark:bg-amber-900/30 ring-2 ring-amber-300 dark:ring-amber-600 ring-inset",
    accentBar: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  { 
    id: "SELESAI", 
    label: "SELESAI", 
    headerBg: "bg-emerald-50 dark:bg-emerald-950/40", 
    headerBorder: "border-emerald-200 dark:border-emerald-800",
    headerText: "text-emerald-700 dark:text-emerald-300",
    headerDot: "bg-emerald-500",
    countBg: "bg-emerald-600 dark:bg-emerald-500",
    bodyBg: "bg-emerald-50/30 dark:bg-emerald-950/10",
    bodyBorder: "border-emerald-200/60 dark:border-emerald-800/40",
    dropHighlight: "bg-emerald-100/60 dark:bg-emerald-900/30 ring-2 ring-emerald-300 dark:ring-emerald-600 ring-inset",
    accentBar: "bg-gradient-to-r from-emerald-500 to-green-500",
  },
];

export function DisposisiKanban({ 
  cards, 
  onCardClick, 
  onDragEnd, 
  activeCardId, 
  availableDocuments,
  onAddDocument,
  onDeleteCard,
}: DisposisiKanbanProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchDoc, setSearchDoc] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDocs = availableDocuments.filter(doc => 
    doc.title?.toLowerCase().includes(searchDoc.toLowerCase()) || 
    doc.documentNumber?.toLowerCase().includes(searchDoc.toLowerCase())
  );

  // DragDropContext needs to be mounted on client only to prevent hydration mismatch
  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* The outer container fills the remaining height and scrolls horizontally only */}
      <div className="flex gap-5 h-full overflow-x-auto pb-2">
        {columnConfig.map((col) => {
          const columnData = cards.filter(d => d.status === col.id);
          
          return (
            <div 
              key={col.id} 
              className={`flex flex-col min-w-[300px] flex-1 rounded-xl border-2 ${col.bodyBorder} overflow-hidden shadow-sm`}
            >
              {/* Accent Bar at top */}
              <div className={`h-1 w-full ${col.accentBar} flex-shrink-0`} />

              {/* Column Header — fixed */}
              <div className={`flex items-center justify-between px-3 py-2.5 ${col.headerBg} border-b ${col.headerBorder} flex-shrink-0`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.headerDot} ring-2 ring-white dark:ring-slate-800 shadow-sm`} />
                  <span className={`text-[11px] font-bold tracking-wider ${col.headerText}`}>{col.label}</span>
                  <span className={`text-[10px] text-white ${col.countBg} min-w-[20px] h-[20px] flex items-center justify-center rounded-full font-bold shadow-sm`}>
                    {columnData.length}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-slate-400">
                  <button className="p-1 hover:bg-white/60 dark:hover:bg-slate-700 rounded transition-colors"><Plus size={13} /></button>
                  <button className="p-1 hover:bg-white/60 dark:hover:bg-slate-700 rounded transition-colors"><MoreVertical size={13} /></button>
                </div>
              </div>

              {/* Column Content / Droppable — this is the scrollable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col flex-1 overflow-y-auto px-2.5 py-2.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent transition-all duration-200 min-h-0 ${
                      snapshot.isDraggingOver 
                        ? col.dropHighlight
                        : col.bodyBg
                    }`}
                  >
                    {columnData.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-600 opacity-60">
                        <GripVertical size={20} className="mb-1.5 opacity-30" />
                        <span className="text-[11px]">Tidak ada disposisi</span>
                      </div>
                    )}

                    {columnData.map((data, index) => (
                      <DisposisiCard 
                        key={data.id} 
                        index={index}
                        data={data} 
                        onClick={onCardClick}
                        isActive={activeCardId === data.id}
                        showDelete={col.id === "BARU"}
                        onDelete={onDeleteCard}
                      />
                    ))}
                    {provided.placeholder}
                    
                    {/* Only show "Tambah Disposisi" in BARU column */}
                    {col.id === "BARU" && (
                      <div className="relative mt-1 flex-shrink-0" ref={dropdownRef}>
                        <button 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-blue-500 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors text-[11px] font-semibold"
                        >
                          <Plus size={13} />
                          Tambah Disposisi
                        </button>

                        {/* Dropdown Menu for Documents */}
                        {isDropdownOpen && (
                          <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-2.5 border-b border-slate-100 dark:border-slate-700">
                              <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Cari surat..."
                                  value={searchDoc}
                                  onChange={(e) => setSearchDoc(e.target.value)}
                                  className="w-full pl-7 pr-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006633] text-slate-700 dark:text-slate-300"
                                />
                              </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                              {filteredDocs.length > 0 ? (
                                filteredDocs.map(doc => (
                                  <button 
                                    key={doc.id}
                                    onClick={() => {
                                      onAddDocument(doc);
                                      setIsDropdownOpen(false);
                                      setSearchDoc("");
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2.5"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                      <FileDown size={12} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                                      <p className="text-[9px] text-slate-500 truncate">{doc.documentNumber || 'No Number'}</p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-[11px] text-slate-500">
                                  Tidak ada surat ditemukan.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
