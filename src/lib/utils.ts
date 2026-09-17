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

  const wf = doc.workflowInstances?.[0] || doc.workflowInstance;
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

