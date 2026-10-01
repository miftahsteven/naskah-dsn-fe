import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBasePath = (): string => {
  return process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : '/office';
};

export const getAssetUrl = (path: string): string => {
  const basePath = getBasePath();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (basePath && !cleanPath.startsWith(basePath)) {
    return `${basePath}${cleanPath}`;
  }
  return cleanPath;
};

/**
 * Cleans job title to ensure standard Indonesian organizational title is used.
 * Strips English translations following a slash or standalone (e.g. "Ketua/Chairman" -> "Ketua", "Sekretaris/Secretary" -> "Sekretaris").
 */
export function cleanJobTitle(rawTitle?: string | null): string {
  if (!rawTitle) return '';
  let clean = rawTitle.trim();

  // Strip English translation after slash (e.g. "Ketua/Chairman" -> "Ketua", "Sekretaris/Secretary" -> "Sekretaris")
  if (clean.includes('/')) {
    clean = (clean.split('/')[0] || '').trim();
  }

  // Strip trailing commas if any
  clean = clean.replace(/,+$/, '').trim();

  // Standalone English mappings if any
  const lower = clean.toLowerCase();
  if (lower === 'chairman') clean = 'Ketua';
  else if (lower === 'vice chairman' || lower === 'vice chief') clean = 'Wakil Ketua';
  else if (lower === 'secretary') clean = 'Sekretaris';
  else if (lower === 'vice secretary') clean = 'Wakil Sekretaris';
  else if (lower === 'treasurer') clean = 'Bendahara';
  else if (lower === 'vice treasurer') clean = 'Wakil Bendahara';
  else if (lower === 'member') clean = 'Anggota';

  return clean;
}

/**
 * Formats a job title for document signatures.
 * Cleans any English slash translation and guarantees exactly one trailing comma.
 * e.g., "Ketua/Chairman" -> "Ketua,"
 *       "Sekretaris/Secretary," -> "Sekretaris,"
 */
export function formatSignerTitle(t?: string | null): string {
  if (!t) return '';
  const clean = cleanJobTitle(t);
  if (!clean) return '';
  return clean + ',';
}

/**
 * Checks if an outgoing document has already been signed by its final signatory.
 * When true, editing is forbidden.
 */
export function isSignedByFinalSignatory(doc: any): boolean {
  if (!doc) return false;
  if (doc.status === 'SIGNED' || doc.status === 'COMPLETED') return true;

  let wf = doc.workflowInstance;
  if (Array.isArray(doc.workflowInstances) && doc.workflowInstances.length > 0) {
    wf = doc.workflowInstances.reduce((latest: any, curr: any) => {
      if (!latest) return curr;
      if (curr.createdAt && latest.createdAt) {
        return new Date(curr.createdAt) > new Date(latest.createdAt) ? curr : latest;
      }
      return curr;
    }, doc.workflowInstances[doc.workflowInstances.length - 1]);
  }

  if (!wf || !wf.steps || wf.steps.length === 0) {
    return false;
  }

  const steps = [...wf.steps].sort((a: any, b: any) => a.stepNumber - b.stepNumber);
  
  // Signatory steps have role 'PENANDATANGAN'
  const signatorySteps = steps.filter((s: any) => {
    const role = s.roleId || s.role;
    return role === 'PENANDATANGAN';
  });

  // The final signatory is the signatory step with the highest stepNumber,
  // or the last non-pemparaf/non-approver step, or simply the last step in the workflow.
  const finalSignatoryStep = signatorySteps.length > 0 
    ? signatorySteps[signatorySteps.length - 1]
    : steps.filter((s: any) => {
        const role = s.roleId || s.role;
        return role !== 'PEMPARAF' && role !== 'APPROVER';
      }).pop() || steps[steps.length - 1];

  if (!finalSignatoryStep) return false;

  // If the final step is APPROVED, then the final signatory has signed!
  if (finalSignatoryStep.status === 'APPROVED') return true;

  // Check if signatures array explicitly contains a signed entry for this final signatory
  if (finalSignatoryStep.userId && doc.signatures && Array.isArray(doc.signatures)) {
    const isSigned = doc.signatures.some((sig: any) => sig.userId === finalSignatoryStep.userId && sig.signedAt);
    if (isSigned) return true;
  }

  return false;
}

/**
 * Checks if the entire signing workflow progress for an outgoing document has reached 100%.
 * Returns true ONLY when all steps in the signing workflow are APPROVED and no pending/unsigned signatories remain.
 */
export function isSigningFlowComplete(doc: any): boolean {
  if (!doc) return false;

  // Documents in rejected, revision, cancelled, or draft status cannot be 100% complete
  if (
    doc.status === 'REJECTED' ||
    doc.status === 'REVISION' ||
    doc.status === 'CANCELLED' ||
    doc.status === 'DRAFT'
  ) {
    return false;
  }

  // 1. Check workflow steps
  let wf = doc.workflowInstance;
  if (Array.isArray(doc.workflowInstances) && doc.workflowInstances.length > 0) {
    wf = doc.workflowInstances.reduce((latest: any, curr: any) => {
      if (!latest) return curr;
      if (curr.createdAt && latest.createdAt) {
        return new Date(curr.createdAt) > new Date(latest.createdAt) ? curr : latest;
      }
      return curr;
    }, doc.workflowInstances[doc.workflowInstances.length - 1]);
  }

  if (wf && Array.isArray(wf.steps) && wf.steps.length > 0) {
    const steps = wf.steps;
    const totalSteps = steps.length;
    const approvedSteps = steps.filter((s: any) => s.status === 'APPROVED').length;

    // Must be 100% of steps approved
    if (totalSteps === 0 || approvedSteps < totalSteps) {
      return false;
    }

    // Explicitly verify that no signatory is unapproved
    const hasUnsignedSignatory = steps.some((s: any) => {
      const role = s.roleId || s.role;
      return (role === 'PENANDATANGAN' || role === 'SIGNER' || !role) && s.status !== 'APPROVED';
    });

    if (hasUnsignedSignatory) {
      return false;
    }

    return true;
  }

  // 2. Check signatures array if document uses direct signature model without workflow instance
  if (doc.signatures && Array.isArray(doc.signatures) && doc.signatures.length > 0) {
    const allSigned = doc.signatures.every((sig: any) => !!sig.signedAt || sig.status === 'SIGNED');
    return allSigned;
  }

  // 3. Fallback: if document status is explicitly COMPLETED or SIGNED
  if (doc.status === 'COMPLETED' || doc.status === 'SIGNED') {
    return true;
  }

  return false;
}

export interface DocumentSignerItem {
  name: string;
  title: string;
  isPlaceholder?: boolean;
}

/**
 * Builds the official DSN-MUI signatures HTML block dynamically supporting
 * 1, 2, 3, or 4+ signers, with exact header alignment and QR placeholder comments.
 */
export function buildSignaturesHtml(signers: DocumentSignerItem[]): string {
  if (!signers || signers.length === 0) return "";

  // 1. Single Signer Layout (Right aligned with official header)
  if (signers.length === 1) {
    const s = signers[0];
    const title = formatSignerTitle(s.title) || "Penandatangan 1,";
    return `
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid;">
        <tbody>
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; vertical-align: top; padding: 0; text-align: right;">
              <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
                <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px; color: #111827;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
                <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${title}</div>
                <!-- QR_CODE_TTE_PLACEHOLDER -->
                <div style="height: 60px;"></div>
                <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${s.name}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // 2. Exactly 2 Signers Layout (Right: Penandatangan 1 under header; Left: Penandatangan 2)
  if (signers.length === 2) {
    const s1 = signers[0]; // Penandatangan 1 (Right under Header)
    const s2 = signers[1]; // Penandatangan 2 (Left)
    const title1 = formatSignerTitle(s1.title) || "Penandatangan 1,";
    const title2 = formatSignerTitle(s2.title) || "Penandatangan 2,";

    return `
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid;">
        <tbody>
          <tr>
            <td style="width: 48%; vertical-align: top; padding: 0; text-align: left;">
              <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
                <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
                <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${title2}</div>
                <!-- QR_CODE_TTE_PLACEHOLDER -->
                <div style="height: 60px;"></div>
                <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${s2.name}</span>
              </div>
            </td>
            <td style="width: 52%; vertical-align: top; padding: 0; text-align: right;">
              <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
                <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px; color: #111827;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
                <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${title1}</div>
                <!-- QR_CODE_TTE_PLACEHOLDER -->
                <div style="height: 60px;"></div>
                <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${s1.name}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // 3. Exactly 3 Signers Layout (Right-to-Left: Right=Penandatangan 1, Center=Penandatangan 2, Left=Penandatangan 3)
  if (signers.length === 3) {
    const s1 = signers[0]; // Penandatangan 1 (Right under Header)
    const s2 = signers[1]; // Penandatangan 2 (Center)
    const s3 = signers[2]; // Penandatangan 3 (Left)
    const title1 = formatSignerTitle(s1.title) || "Penandatangan 1,";
    const title2 = formatSignerTitle(s2.title) || "Penandatangan 2,";
    const title3 = formatSignerTitle(s3.title) || "Penandatangan 3,";

    return `
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid;">
        <tbody>
          <tr>
            <td style="width: 33%; vertical-align: top; padding: 0; text-align: left;">
              <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
                <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
                <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${title3}</div>
                <!-- QR_CODE_TTE_PLACEHOLDER -->
                <div style="height: 60px;"></div>
                <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${s3.name}</span>
              </div>
            </td>
            <td style="width: 33%; vertical-align: top; padding: 0; text-align: center;">
              <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
                <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
                <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${title2}</div>
                <!-- QR_CODE_TTE_PLACEHOLDER -->
                <div style="height: 60px;"></div>
                <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${s2.name}</span>
              </div>
            </td>
            <td style="width: 34%; vertical-align: top; padding: 0; text-align: right;">
              <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
                <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px; color: #111827;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
                <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${title1}</div>
                <!-- QR_CODE_TTE_PLACEHOLDER -->
                <div style="height: 60px;"></div>
                <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${s1.name}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // 4. 4 or More Signers Layout (2 columns per row, ordered right-to-left)
  // Row 0: Right = Penandatangan 1, Left = Penandatangan 2
  // Row 1: Right = Penandatangan 3, Left = Penandatangan 4
  let rowsHtml = "";
  for (let i = 0; i < signers.length; i += 2) {
    const sRight = signers[i];     // Penandatangan 1, 3, 5... (Right column)
    const sLeft = signers[i + 1];  // Penandatangan 2, 4, 6... (Left column)
    const isFirstRow = i === 0;

    const tRight = formatSignerTitle(sRight.title) || `Penandatangan ${i + 1},`;
    const tLeft = sLeft ? formatSignerTitle(sLeft.title) || `Penandatangan ${i + 2},` : "";

    rowsHtml += `
      <tr>
        <td style="width: 48%; vertical-align: top; padding: ${isFirstRow ? "0" : "24px 0 0 0"}; text-align: left;">
          ${sLeft ? `
            <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
              ${isFirstRow ? `
                <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
              ` : ""}
              <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${tLeft}</div>
              <!-- QR_CODE_TTE_PLACEHOLDER -->
              <div style="height: 60px;"></div>
              <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${sLeft.name}</span>
            </div>
          ` : ""}
        </td>
        <td style="width: 52%; vertical-align: top; padding: ${isFirstRow ? "0" : "24px 0 0 0"}; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            ${isFirstRow ? `
              <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; margin-bottom: 6px; color: #111827;">BADAN PENGURUS<br>DEWAN SYARIAH NASIONAL-<br>MAJELIS ULAMA INDONESIA</div>
            ` : ""}
            <div style="font-weight: bold; font-size: 10.5pt; color: #111827;">${tRight}</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap; color: #111827;">${sRight.name}</span>
          </div>
        </td>
      </tr>
    `;
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid;">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

