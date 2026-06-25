"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  FilePlus2, 
  RefreshCw, 
  CheckCircle2, 
  ClockAlert,
  Search,
  Filter,
  LayoutGrid,
  X,
  CalendarRange,
  SlidersHorizontal,
} from "lucide-react";
import api from "@/lib/api";
import { Disposisi, StatusDisposisi } from "./types";
import { DisposisiKanban } from "./components/DisposisiKanban";
import { DisposisiDetail } from "./components/DisposisiDetail";
import { mockDisposisiData } from "./data/mock";

export default function SuratDisposisiPage() {
  const [activeCard, setActiveCard] = useState<Disposisi | null>(null);
  const [disposisiCards, setDisposisiCards] = useState<Disposisi[]>(mockDisposisiData);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);

  // ── FILTER STATE ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSender, setFilterSender] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── DERIVED UNIQUE VALUES FOR FILTER DROPDOWNS ──
  const uniqueSenders = useMemo(() => {
    const senders = [...new Set(disposisiCards.map(d => d.sender))].sort();
    return senders;
  }, [disposisiCards]);

  const uniqueUnits = useMemo(() => {
    const units = [...new Set(disposisiCards.map(d => d.targetUnit))].sort();
    return units;
  }, [disposisiCards]);

  // ── FILTERED DATA ──
  const filteredCards = useMemo(() => {
    return disposisiCards.filter(card => {
      // Search: match title, sender, documentNumber
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          card.title.toLowerCase().includes(q) ||
          card.sender.toLowerCase().includes(q) ||
          card.documentNumber.toLowerCase().includes(q) ||
          card.targetUnit.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Priority
      if (filterPriority && card.priority !== filterPriority) return false;

      // Sender
      if (filterSender && card.sender !== filterSender) return false;

      // Unit
      if (filterUnit && card.targetUnit !== filterUnit) return false;

      // Date range — parse dd/mm/yyyy from card.date
      if (filterDateFrom || filterDateTo) {
        const parts = card.date.split("/");
        if (parts.length === 3) {
          const cardDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          if (filterDateFrom) {
            const from = new Date(filterDateFrom);
            if (cardDate < from) return false;
          }
          if (filterDateTo) {
            const to = new Date(filterDateTo);
            if (cardDate > to) return false;
          }
        }
      }

      return true;
    });
  }, [disposisiCards, searchQuery, filterPriority, filterSender, filterUnit, filterDateFrom, filterDateTo]);

  const activeFilterCount = [filterPriority, filterSender, filterUnit, filterDateFrom, filterDateTo].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery("");
    setFilterPriority("");
    setFilterSender("");
    setFilterUnit("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // Fetch disposisi cards and available documents
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch kanban cards
        const disposisiRes = await api.get('/disposisi');
        // Convert backend data to frontend format
        const formattedCards = disposisiRes.data.data.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          sender: doc.creator?.fullName || "Internal",
          documentNumber: doc.documentNumber || "-",
          date: new Date(doc.createdAt).toLocaleDateString('id-ID'),
          priority: "Normal", // Or derive from category
          status: doc.disposisiStatus as StatusDisposisi,
          targetUnit: doc.classification?.name || "Umum",
          attachmentsCount: doc.versions?.length || 0,
          commentsCount: doc.workflowInstances?.[0]?.steps?.filter((s:any) => s.comment).length || 0,
          history: [] // the detail view will fetch history
        }));
        setDisposisiCards(formattedCards);

        // Fetch available documents
        const [incomingRes, outgoingRes] = await Promise.all([
          api.get("/documents", { params: { documentType: "INCOMING" } }),
          api.get("/documents", { params: { documentType: "OUTGOING" } })
        ]);
        const combined = [...(incomingRes.data.data || []), ...(outgoingRes.data.data || [])]
          .filter(doc => !doc.disposisiStatus); // only show docs not yet in disposisi
        setAvailableDocuments(combined);
      } catch (error) {
        console.error("Gagal memuat data disposisi:", error);
      }
    };
    fetchData();
  }, []);

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same location
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const cardId = draggableId;
    const newStatus = destination.droppableId as StatusDisposisi;

    // Backup current state for potential rollback
    const originalCards = [...disposisiCards];

    // 1. Optimistic Update (update UI instantly)
    setDisposisiCards(prevCards => {
      const cols: Record<string, Disposisi[]> = {
        "BARU": prevCards.filter(c => c.status === "BARU" && c.id !== cardId),
        "DIPROSES": prevCards.filter(c => c.status === "DIPROSES" && c.id !== cardId),
        "SELESAI": prevCards.filter(c => c.status === "SELESAI" && c.id !== cardId)
      };

      const draggedCard = prevCards.find(c => c.id === cardId);
      if (!draggedCard) return prevCards;

      const updatedCard = { ...draggedCard, status: newStatus };
      cols[newStatus].splice(destination.index, 0, updatedCard);

      return [...cols["BARU"], ...cols["DIPROSES"], ...cols["SELESAI"]];
    });

    // 2. Perform background API call
    try {
      await api.put(`/disposisi/${cardId}/status`, { status: newStatus });
    } catch (error: any) {
      console.error("Gagal memindahkan kartu:", error);
      // 3. Rollback UI if API request fails
      setDisposisiCards(originalCards);
      alert(error.response?.data?.message || "Gagal memindahkan kartu");
    }
  };

  const handleAddDisposisiFromDocument = async (doc: any) => {
    try {
      await api.put(`/disposisi/${doc.id}/status`, { status: 'BARU' });
      
      const newDisposisi: Disposisi = {
        id: doc.id,
        title: doc.title,
        sender: doc.creator?.fullName || "Internal",
        documentNumber: doc.documentNumber || "-",
        date: new Date(doc.createdAt).toLocaleDateString('id-ID'),
        priority: "Normal",
        status: "BARU",
        targetUnit: doc.classification?.name || "Umum",
        attachmentsCount: doc.versions?.length || 0,
        commentsCount: 0,
        history: [] // the detail view will fetch history
      };

      setDisposisiCards(prev => [newDisposisi, ...prev]);
      // Remove from available documents dropdown
      setAvailableDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (error: any) {
      console.error("Gagal menambah dokumen ke disposisi:", error);
      alert(error.response?.data?.message || "Gagal menambah dokumen");
    }
  };

  const handleDeleteDisposisi = async (id: string) => {
    if (!confirm("Hapus disposisi ini? Surat akan dikembalikan untuk perbaikan.")) return;
    try {
      await api.put(`/disposisi/${id}/status`, { status: null });
      // Move card back to available documents
      const removedCard = disposisiCards.find(c => c.id === id);
      setDisposisiCards(prev => prev.filter(c => c.id !== id));
      if (removedCard) {
        setAvailableDocuments(prev => [{ id: removedCard.id, title: removedCard.title, documentNumber: removedCard.documentNumber }, ...prev]);
      }
      // Close detail if it was showing this card
      if (activeCard?.id === id) setActiveCard(null);
    } catch (error: any) {
      console.error("Gagal menghapus disposisi:", error);
      alert(error.response?.data?.message || "Gagal menghapus disposisi");
    }
  };

  const countBaru = filteredCards.filter(d => d.status === "BARU").length;
  const countDiproses = filteredCards.filter(d => d.status === "DIPROSES").length;
  const countSelesai = filteredCards.filter(d => d.status === "SELESAI").length;

  const stats = [
    { label: "Total Disposisi", count: filteredCards.length, icon: FileText, color: "text-slate-600", bgColor: "bg-slate-50 dark:bg-slate-800", borderColor: "border-slate-200 dark:border-slate-700" },
    { label: "Baru", count: countBaru, icon: FilePlus2, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" },
    { label: "Diproses", count: countDiproses, icon: RefreshCw, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
    { label: "Selesai", count: countSelesai, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
    { label: "Lewat Batas Waktu", count: 0, icon: ClockAlert, color: "text-rose-600", bgColor: "bg-rose-50 dark:bg-rose-950/30", borderColor: "border-rose-200 dark:border-rose-800" },
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-white dark:bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-950">
          <div className="text-xs text-slate-500 mb-1">
            Persuratan &gt; <span className="font-semibold text-slate-800 dark:text-slate-200">Disposisi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Disposisi</h1>
          <p className="text-sm text-slate-500">Kelola dan tindak lanjuti disposisi surat</p>

          {/* Stat Cards */}
          <div className="flex items-center gap-4 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {stats.map((stat, idx) => (
              <div key={idx} className={`flex-1 min-w-[160px] bg-white dark:bg-slate-900 border ${stat.borderColor} rounded-xl p-4 flex items-center gap-4 shadow-sm transition-shadow hover:shadow-md`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.count}</div>
                  <div className="text-[11px] font-medium text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="px-6 py-3 flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-950">
          {/* Row 1: Main filters */}
          <div className="flex items-center gap-3 w-full">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Cari judul, pengirim, nomor surat..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Priority Filter */}
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 cursor-pointer focus:outline-none focus:border-[#006633] transition-all ${filterPriority ? 'border-[#006633] text-[#006633] font-medium ring-1 ring-[#006633]/20' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <option value="">Semua Prioritas</option>
              <option value="Tinggi">🔴 Tinggi</option>
              <option value="Normal">🟢 Normal</option>
              <option value="Rendah">🔵 Rendah</option>
            </select>

            {/* Sender Filter */}
            <select 
              value={filterSender}
              onChange={(e) => setFilterSender(e.target.value)}
              className={`px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 cursor-pointer focus:outline-none focus:border-[#006633] transition-all max-w-[200px] ${filterSender ? 'border-[#006633] text-[#006633] font-medium ring-1 ring-[#006633]/20' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <option value="">Semua Pengirim</option>
              {uniqueSenders.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Unit Filter */}
            <select 
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className={`px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 cursor-pointer focus:outline-none focus:border-[#006633] transition-all max-w-[180px] ${filterUnit ? 'border-[#006633] text-[#006633] font-medium ring-1 ring-[#006633]/20' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <option value="">Semua Unit</option>
              {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>

            {/* Advanced filter toggle */}
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${showAdvancedFilters ? 'bg-[#006633] text-white border-[#006633] shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Lanjutan</span>
            </button>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:text-rose-600 px-2 transition-colors"
              >
                <X size={14} />
                Reset ({activeFilterCount})
              </button>
            )}

            {/* Separator + View controls */}
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium text-slate-500">Tampilan</span>
                <select className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900 cursor-pointer focus:outline-none text-slate-700 dark:text-slate-300">
                  <option>Kanban</option>
                  <option>List</option>
                </select>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <button className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 transition-colors">
                <LayoutGrid size={16} />
                Atur Kolom
              </button>
            </div>
          </div>

          {/* Row 2: Advanced filters (collapsible) */}
          {showAdvancedFilters && (
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <CalendarRange size={15} className="text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Rentang Tanggal:</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]"
                />
                <span className="text-xs text-slate-400">—</span>
                <input 
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]"
                />
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }} className="text-xs text-rose-500 hover:text-rose-600 font-medium">
                  Hapus Tanggal
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Filter aktif:</span>
              {filterPriority && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006633]/10 text-[#006633] rounded-full text-xs font-medium">
                  Prioritas: {filterPriority}
                  <button onClick={() => setFilterPriority("")} className="hover:bg-[#006633]/20 rounded-full p-0.5"><X size={10} /></button>
                </span>
              )}
              {filterSender && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006633]/10 text-[#006633] rounded-full text-xs font-medium max-w-[200px] truncate">
                  Pengirim: {filterSender}
                  <button onClick={() => setFilterSender("")} className="hover:bg-[#006633]/20 rounded-full p-0.5 flex-shrink-0"><X size={10} /></button>
                </span>
              )}
              {filterUnit && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006633]/10 text-[#006633] rounded-full text-xs font-medium">
                  Unit: {filterUnit}
                  <button onClick={() => setFilterUnit("")} className="hover:bg-[#006633]/20 rounded-full p-0.5"><X size={10} /></button>
                </span>
              )}
              {filterDateFrom && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006633]/10 text-[#006633] rounded-full text-xs font-medium">
                  Dari: {filterDateFrom}
                  <button onClick={() => setFilterDateFrom("")} className="hover:bg-[#006633]/20 rounded-full p-0.5"><X size={10} /></button>
                </span>
              )}
              {filterDateTo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006633]/10 text-[#006633] rounded-full text-xs font-medium">
                  Sampai: {filterDateTo}
                  <button onClick={() => setFilterDateTo("")} className="hover:bg-[#006633]/20 rounded-full p-0.5"><X size={10} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kanban Board Area — flex-1 + overflow-hidden keeps it within viewport */}
        <div className="flex-1 overflow-hidden bg-[#F5F6FA] dark:bg-slate-900/50 p-4">
          <DisposisiKanban 
            cards={filteredCards}
            onCardClick={(data) => setActiveCard(data)} 
            onDragEnd={handleDragEnd}
            activeCardId={activeCard?.id}
            availableDocuments={availableDocuments}
            onAddDocument={handleAddDisposisiFromDocument}
            onDeleteCard={handleDeleteDisposisi}
          />
        </div>
      </div>

      {/* Side Panel Detail */}
      {activeCard && (
        <DisposisiDetail 
          data={activeCard} 
          onClose={() => setActiveCard(null)} 
        />
      )}
    </div>
  );
}
