/**
 * Utilitas Penghitungan Hari Kerja (Working Days) & SLA 14 Hari Kerja DSN-MUI
 * Mengabaikan hari Sabtu dan Minggu (Senin - Jumat dihitung sebagai hari kerja).
 */

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Minggu, 6 = Sabtu
}

/**
 * Menambahkan sejumlah hari kerja dari tanggal awal.
 */
export function addWorkingDays(startDate: Date | string, days: number): Date {
  const result = new Date(startDate);
  result.setHours(0, 0, 0, 0);

  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      added++;
    }
  }
  return result;
}

/**
 * Menghitung selisih hari kerja antara dua tanggal (Senin - Jumat).
 */
export function countWorkingDaysBetween(
  startDate: Date | string,
  endDate: Date | string = new Date()
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start > end) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current < end) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current)) {
      count++;
    }
  }

  return count;
}

export interface SlaCalculationResult {
  hasSla: boolean;
  targetWorkingDays: number;
  submittedAt: Date | null;
  completedAt: Date | null;
  targetDeadline: Date | null;
  isCompleted: boolean;
  workingDaysElapsed: number;
  remainingWorkingDays: number;
  isOverdue: boolean;
  overdueDays: number;
  percentUsed: number;
  label: string;
  subLabel: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'info';
}

/**
 * Menghitung status SLA komprehensif untuk pengajuan
 */
export function calculateSlaStatus(
  submittedAtInput?: Date | string | null,
  completedAtInput?: Date | string | null,
  targetWorkingDays: number = 14
): SlaCalculationResult {
  if (!submittedAtInput) {
    return {
      hasSla: false,
      targetWorkingDays,
      submittedAt: null,
      completedAt: null,
      targetDeadline: null,
      isCompleted: false,
      workingDaysElapsed: 0,
      remainingWorkingDays: targetWorkingDays,
      isOverdue: false,
      overdueDays: 0,
      percentUsed: 0,
      label: 'Belum Diajukan',
      subLabel: 'Menunggu pengiriman permohonan',
      badgeVariant: 'info',
    };
  }

  const submittedAt = new Date(submittedAtInput);
  const completedAt = completedAtInput ? new Date(completedAtInput) : null;
  const targetDeadline = addWorkingDays(submittedAt, targetWorkingDays);

  if (completedAt) {
    const workingDaysUsed = countWorkingDaysBetween(submittedAt, completedAt);
    const isWithinSla = workingDaysUsed <= targetWorkingDays;

    return {
      hasSla: true,
      targetWorkingDays,
      submittedAt,
      completedAt,
      targetDeadline,
      isCompleted: true,
      workingDaysElapsed: workingDaysUsed,
      remainingWorkingDays: Math.max(0, targetWorkingDays - workingDaysUsed),
      isOverdue: !isWithinSla,
      overdueDays: isWithinSla ? 0 : workingDaysUsed - targetWorkingDays,
      percentUsed: Math.min(100, Math.round((workingDaysUsed / targetWorkingDays) * 100)),
      label: isWithinSla
        ? `Selesai ${workingDaysUsed} Hari Kerja (Sesuai SLA)`
        : `Selesai ${workingDaysUsed} Hari Kerja (Melebihi SLA)`,
      subLabel: `Target SLA: ${targetWorkingDays} Hari Kerja DSN-MUI`,
      badgeVariant: isWithinSla ? 'success' : 'warning',
    };
  }

  // Pengajuan aktif (sedang berjalan)
  const now = new Date();
  const workingDaysElapsed = countWorkingDaysBetween(submittedAt, now);
  const remainingWorkingDays = targetWorkingDays - workingDaysElapsed;
  const isOverdue = remainingWorkingDays < 0;
  const overdueDays = isOverdue ? Math.abs(remainingWorkingDays) : 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((workingDaysElapsed / targetWorkingDays) * 100)));

  let label = '';
  let badgeVariant: 'success' | 'warning' | 'danger' = 'success';

  if (isOverdue) {
    label = `Terlewat ${overdueDays} Hari Kerja`;
    badgeVariant = 'danger';
  } else if (remainingWorkingDays === 0) {
    label = `Hari Terakhir SLA (Hari ke-${workingDaysElapsed})`;
    badgeVariant = 'warning';
  } else if (remainingWorkingDays <= 3) {
    label = `Sisa ${remainingWorkingDays} Hari Kerja`;
    badgeVariant = 'warning';
  } else {
    label = `Sisa ${remainingWorkingDays} Hari Kerja`;
    badgeVariant = 'success';
  }

  const deadlineFormatted = targetDeadline.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    hasSla: true,
    targetWorkingDays,
    submittedAt,
    completedAt: null,
    targetDeadline,
    isCompleted: false,
    workingDaysElapsed,
    remainingWorkingDays,
    isOverdue,
    overdueDays,
    percentUsed,
    label,
    subLabel: `Batas SLA 14 Hari Kerja: ${deadlineFormatted}`,
    badgeVariant,
  };
}
