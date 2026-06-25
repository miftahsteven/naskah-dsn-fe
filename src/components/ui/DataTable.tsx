"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsUpDown, 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[]; // Predefined options. If not provided, auto-calculates from unique values.
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  initialRowsPerPage?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Cari data...",
  onRowClick,
  emptyMessage = "Tidak ada data yang ditemukan.",
  actions,
  initialRowsPerPage = 10
}: DataTableProps<T>) {
  // States
  const [globalSearch, setGlobalSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  // Dynamic filter options generated from unique values if filterOptions is not provided
  const computedFilterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    columns.forEach(col => {
      if (col.filterable) {
        if (col.filterOptions) {
          options[col.key] = col.filterOptions;
        } else {
          // Auto-extract unique non-empty string values from the data
          const uniques = Array.from(
            new Set(
              data
                .map(row => {
                  const val = row[col.key];
                  if (typeof val === "string") return val.trim();
                  if (val === null || val === undefined) return "";
                  return String(val);
                })
                .filter(val => val !== "")
            )
          ) as string[];
          options[col.key] = uniques.sort();
        }
      }
    });
    return options;
  }, [data, columns]);

  // Handle filter changes
  const handleFilterChange = (columnKey: string, value: string) => {
    setColumnFilters(prev => {
      const updated = { ...prev };
      if (value === "") {
        delete updated[columnKey];
      } else {
        updated[columnKey] = value;
      }
      return updated;
    });
    setCurrentPage(1); // Reset to first page
  };

  // Clear all filters & search
  const clearAllFilters = () => {
    setGlobalSearch("");
    setColumnFilters({});
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = globalSearch !== "" || Object.keys(columnFilters).length > 0;

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  };

  // Filtered and sorted data pipeline
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Global Search Filter
    if (globalSearch.trim() !== "") {
      const query = globalSearch.toLowerCase().trim();
      result = result.filter(row => {
        return columns.some(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // 2. Column-Level Dropdown Filters
    Object.keys(columnFilters).forEach(colKey => {
      const filterValue = columnFilters[colKey];
      if (filterValue !== "") {
        result = result.filter(row => {
          const value = row[colKey];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase() === filterValue.toLowerCase();
        });
      }
    });

    // 3. Sorting
    if (sortConfig.key && sortConfig.direction) {
      const key = sortConfig.key;
      const direction = sortConfig.direction;

      result.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        // Check if numeric sorting
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return direction === "asc" ? numA - numB : numB - numA;
        }

        return direction === "asc" 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, columns, globalSearch, columnFilters, sortConfig]);

  // Pagination calculations
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, totalItems);

  // Generate pagination page numbers
  const pageNumbers = useMemo(() => {
    const range: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (start === 1) {
        end = maxVisiblePages;
      } else if (end === totalPages) {
        start = totalPages - maxVisiblePages + 1;
      }

      for (let i = start; i <= end; i++) {
        range.push(i);
      }
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="w-full space-y-4">
      {/* ── Filter & Search Control Panel ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Left: Global Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] transition-all placeholder-slate-400 text-slate-800 dark:text-slate-200"
            placeholder={searchPlaceholder}
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          {globalSearch && (
            <button
              onClick={() => {
                setGlobalSearch("");
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-650"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Dropdown Column Filters & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {columns.map(col => {
            if (!col.filterable) return null;
            const currentFilter = columnFilters[col.key] || "";
            const options = computedFilterOptions[col.key] || [];

            return (
              <div key={col.key} className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider hidden lg:inline">
                  {col.label}:
                </span>
                <select
                  value={currentFilter}
                  onChange={(e) => handleFilterChange(col.key, e.target.value)}
                  className="px-2.5 py-2 text-[11px] font-semibold bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-700 dark:text-slate-350 cursor-pointer min-w-[120px]"
                >
                  <option value="">Semua {col.label}</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-[11px] font-bold text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/15 rounded-lg border border-[#006633]/20 transition-all uppercase tracking-wider"
            >
              <X size={12} /> Reset Filter
            </button>
          )}
        </div>

      </div>

      {/* ── Table Container ── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#006633]/8 dark:bg-[#006633]/15 border-b border-slate-200 dark:border-slate-800">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{ width: col.width }}
                    className={cn(
                      "py-3.5 px-4 text-[9px] uppercase tracking-widest text-[#006633] dark:text-emerald-400 font-extrabold select-none",
                      col.sortable ? "cursor-pointer hover:text-[#006633] hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors" : ""
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortConfig.key === col.key ? (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp size={12} className="text-[#006633]" />
                            ) : (
                              <ChevronDown size={12} className="text-[#006633]" />
                            )
                          ) : (
                            <ChevronsUpDown size={11} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="py-3.5 px-4 text-[9px] uppercase tracking-widest text-[#006633] dark:text-emerald-400 font-extrabold text-right">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (actions ? 1 : 0)} 
                    className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest font-mono"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={row.id || rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors",
                      onRowClick ? "hover:bg-slate-50/70 dark:hover:bg-slate-800/20 cursor-pointer" : "hover:bg-slate-50/20 dark:hover:bg-slate-800/5"
                    )}
                  >
                    {columns.map(col => {
                      const cellValue = row[col.key];
                      return (
                        <td key={col.key} className="py-3.5 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {col.render ? col.render(cellValue, row, (currentPage - 1) * rowsPerPage + rowIndex + 1) : (cellValue !== null && cellValue !== undefined ? String(cellValue) : "-")}
                        </td>
                      );
                    })}
                    {actions && (
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10">
          {/* Item Count Indicator */}
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Menampilkan <span className="font-mono text-slate-800 dark:text-white">{startIndex}</span> - <span className="font-mono text-slate-800 dark:text-white">{endIndex}</span> dari <span className="font-mono text-slate-850 dark:text-white">{totalItems}</span> data
          </div>

          {/* Controls: Rows Per Page & Page buttons */}
          <div className="flex items-center gap-4">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Tampilkan:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-[#006633] text-slate-700 dark:text-slate-350 cursor-pointer"
              >
                {[5, 10, 25, 50, 100].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            {/* Page Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                
                {pageNumbers.map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-mono font-bold rounded border transition-colors",
                      currentPage === page
                        ? "bg-[#006633] text-white border-[#006633]"
                        : "bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
