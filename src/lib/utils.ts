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

