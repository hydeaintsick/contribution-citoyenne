import type { BugReportStatus, BugReportType } from "@prisma/client";

export const BUG_REPORT_STATUS_LABELS: Record<BugReportStatus, string> = {
  TO_BE_QUALIFIED: "À qualifier",
  TO_DO: "À faire",
  IN_PROGRESS: "En cours",
  DEPLOYED: "Déployé",
  DONE: "Terminé",
};

export const BUG_REPORT_STATUS_BADGES: Record<BugReportStatus, string> = {
  TO_BE_QUALIFIED: "fr-badge--info",
  TO_DO: "fr-badge--warning",
  IN_PROGRESS: "fr-badge--new",
  DEPLOYED: "fr-badge--success",
  DONE: "fr-badge--success",
};

export const BUG_REPORT_TYPE_LABELS: Record<BugReportType, string> = {
  BUG: "Bug",
  FEATURE: "Feature",
};

export const BUG_REPORT_TYPE_BADGES: Record<BugReportType, string> = {
  BUG: "fr-badge--error",
  FEATURE: "fr-badge--purple-glycine",
};

export const BUG_REPORT_STATUS_ORDER: BugReportStatus[] = [
  "TO_BE_QUALIFIED",
  "TO_DO",
  "IN_PROGRESS",
  "DEPLOYED",
  "DONE",
];

export const PUBLIC_BUG_REPORT_STATUSES: BugReportStatus[] = [
  "TO_DO",
  "IN_PROGRESS",
  "DEPLOYED",
  "DONE",
];

export function compareBugReportStatuses(a: BugReportStatus, b: BugReportStatus) {
  const indexA = BUG_REPORT_STATUS_ORDER.indexOf(a);
  const indexB = BUG_REPORT_STATUS_ORDER.indexOf(b);
  return indexA - indexB;
}


