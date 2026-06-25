import { Disposisi } from "../types";

export const mockDisposisiData: Disposisi[] = [
  {
    id: "DSP-001",
    title: "Surat Edaran OJK tentang Penerapan Prinsip Syariah",
    sender: "Otoritas Jasa Keuangan (OJK)",
    documentNumber: "SM.06.2026.0015",
    date: "09/06/2026",
    priority: "Normal",
    status: "BARU",
    targetUnit: "Sekretariat",
    attachmentsCount: 2,
    commentsCount: 0,
    dueDate: "20 Juni 2026",
    attachmentSize: "1.2 MB",
    history: [
      {
        id: "h1",
        date: "09/06/2026",
        time: "10:00",
        title: "Diterima oleh Sekretariat",
        description: "Surat telah diterima dan sedang menunggu disposisi lebih lanjut.",
        isCompleted: true,
      }
    ]
  },
  {
    id: "DSP-002",
    title: "Permohonan Fatwa Produk Pembiayaan iB Hasanah",
    sender: "PT BPRS Amanah Sejahtera",
    documentNumber: "SM.06.2026.0016",
    date: "09/06/2026",
    priority: "Tinggi",
    status: "BARU",
    targetUnit: "Bidang Fatwa",
    attachmentsCount: 3,
    commentsCount: 0,
    dueDate: "12 Juni 2026",
    attachmentSize: "3.5 MB",
    history: [
      {
        id: "h1",
        date: "09/06/2026",
        time: "11:30",
        title: "Diterima oleh Bidang Fatwa",
        description: "Menunggu penelaahan awal.",
        isCompleted: true,
      }
    ]
  },
  {
    id: "DSP-003",
    title: "Laporan Hasil Pengawasan DPS Triwulan I 2026",
    sender: "PT Bank Syariah Indonesia Tbk",
    documentNumber: "SM.06.2026.0012",
    date: "09/06/2026",
    priority: "Tinggi",
    status: "DIPROSES",
    targetUnit: "Bidang Relasi & Regulasi",
    attachmentsCount: 1,
    commentsCount: 1,
    dueDate: "15 Juni 2026",
    attachmentSize: "245 KB",
    history: [
      {
        id: "h1",
        date: "09/06/2026",
        time: "09:15",
        title: "Didisposisikan oleh Sekretaris DSN-MUI",
        description: "\"Mohon ditindaklanjuti dan dikaji lebih lanjut.\"",
        author: "Dr. Asrori S. Karni, S.Ag., M.H.",
        isCompleted: true,
      },
      {
        id: "h2",
        date: "09/06/2026",
        time: "09:32",
        title: "Diterima oleh Bidang Relasi & Regulasi",
        description: "Telah diterima dan dibaca.",
        isCompleted: true,
      },
      {
        id: "h3",
        date: "10/06/2026",
        time: "14:20",
        title: "Dalam Proses",
        description: "Catatan: Telah dijadwalkan untuk dibahas dalam rapat bidang.",
        isCompleted: true,
      },
      {
        id: "h4",
        date: "",
        time: "",
        title: "Menunggu Selesai",
        description: "Batas waktu 15/06/2026",
        isCompleted: false,
      }
    ]
  },
  {
    id: "DSP-004",
    title: "Undangan Rapat Koordinasi LKS Syariah",
    sender: "Kementerian Keuangan RI",
    documentNumber: "SM.06.2026.0013",
    date: "09/06/2026",
    priority: "Normal",
    status: "DIPROSES",
    targetUnit: "Sekretariat",
    attachmentsCount: 0,
    commentsCount: 0,
    dueDate: "14 Juni 2026",
    history: [
      {
        id: "h1",
        date: "09/06/2026",
        time: "08:00",
        title: "Diterima oleh Sekretariat",
        description: "Menunggu konfirmasi kehadiran.",
        isCompleted: true,
      }
    ]
  },
  {
    id: "DSP-005",
    title: "Surat Konfirmasi Data DPS PT XYZ Syariah",
    sender: "PT XYZ Syariah",
    documentNumber: "SM.06.2026.0009",
    date: "05/06/2026",
    priority: "Normal",
    status: "SELESAI",
    targetUnit: "Bidang DPS",
    attachmentsCount: 0,
    commentsCount: 1,
    dueDate: "10 Juni 2026",
    history: [
      {
        id: "h1",
        date: "05/06/2026",
        time: "10:00",
        title: "Diterima oleh Bidang DPS",
        description: "Data sedang diverifikasi.",
        isCompleted: true,
      },
      {
        id: "h2",
        date: "08/06/2026",
        time: "15:30",
        title: "Selesai",
        description: "Data telah dikonfirmasi dan surat balasan telah dikirim.",
        isCompleted: true,
      }
    ]
  }
];
