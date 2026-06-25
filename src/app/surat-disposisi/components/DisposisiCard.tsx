import React from "react";
import { Disposisi } from "../types";
import { Paperclip, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";

interface DisposisiCardProps {
  data: Disposisi;
  index: number;
  onClick: (data: Disposisi) => void;
  isActive?: boolean;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

export function DisposisiCard({ data, index, onClick, isActive, showDelete, onDelete }: DisposisiCardProps) {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Tinggi":
        return { badge: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800", dot: "bg-rose-500" };
      case "Rendah":
        return { badge: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800", dot: "bg-blue-500" };
      default:
        return { badge: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" };
    }
  };

  const pStyle = getPriorityStyle(data.priority);

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(data)}
          className={cn(
            "bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 border transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-md mb-2 group relative",
            isActive 
              ? "border-[#006633] ring-2 ring-[#006633]/20 shadow-md" 
              : "border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            snapshot.isDragging 
              ? "shadow-2xl border-[#006633]/50 scale-[1.02] rotate-1 z-50 opacity-95" 
              : "shadow-sm"
          )}
        >
          {/* Delete button — only visible on BARU cards */}
          {showDelete && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(data.id); }}
              title="Hapus dari disposisi"
              className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Row 1: Title + priority (compact) */}
          <div className="flex items-start gap-2 mb-1.5">
            <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-tight line-clamp-1 flex-1 group-hover:text-[#006633] dark:group-hover:text-emerald-400 transition-colors">
              {data.title}
            </h4>
            <span className={cn("text-[9px] px-1.5 py-px rounded-full border font-semibold flex items-center gap-1 flex-shrink-0 whitespace-nowrap", pStyle.badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", pStyle.dot)} />
              {data.priority}
            </span>
          </div>

          {/* Row 2: Sender + doc number */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="truncate max-w-[55%]">{data.sender}</span>
            <span className="font-mono bg-slate-50 dark:bg-slate-700 px-1.5 py-px rounded text-[9px] text-slate-400 flex-shrink-0">{data.documentNumber}</span>
          </div>

          {/* Row 3: Footer — attachments, comments, unit, date */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5">
                <Paperclip size={10} />
                <span>{data.attachmentsCount}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <MessageSquare size={10} />
                <span>{data.commentsCount}</span>
              </div>
              {data.targetUnit && (
                <span className="px-1.5 py-px rounded bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[90px] border border-slate-100 dark:border-slate-600">
                  {data.targetUnit}
                </span>
              )}
            </div>
            <span className="text-slate-400">{data.date}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
