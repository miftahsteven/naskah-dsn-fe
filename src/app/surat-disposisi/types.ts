export type StatusDisposisi = "BARU" | "DIPROSES" | "SELESAI";
export type PrioritasSurat = "Tinggi" | "Normal" | "Rendah";

export interface DisposisiHistory {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  author?: string;
  isCompleted?: boolean;
}

export interface Disposisi {
  id: string;
  title: string;
  sender: string;
  documentNumber: string;
  date: string;
  priority: PrioritasSurat;
  status: StatusDisposisi;
  targetUnit: string;
  attachmentsCount: number;
  commentsCount: number;
  dueDate?: string;
  attachmentSize?: string;
  history: DisposisiHistory[];
}
