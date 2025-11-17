export type ActivityType =
  | "USER_LOGIN"
  | "CONTRIBUTION_CREATED"
  | "CONTRIBUTION_CLOSED"
  | "CONTRIBUTION_UPDATED"
  | "CITY_AUDIT"
  | "CONTACT_TICKET_PROCESSED";

export type ActivityUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
} | null;

export type ActivityMetadata =
  | {
      type: "USER_LOGIN";
      ipAddress?: string | null;
      userAgent?: string | null;
      communeId?: string | null;
      communeName?: string | null;
    }
  | {
      type: "CONTRIBUTION_CREATED" | "CONTRIBUTION_CLOSED" | "CONTRIBUTION_UPDATED";
      contributionId: string;
      communeId: string;
      communeName: string;
      contributionTitle: string;
    }
  | {
      type: "CITY_AUDIT";
      communeId: string;
      communeName: string;
      action: "CREATED" | "UPDATED";
      details?: unknown;
    }
  | {
      type: "CONTACT_TICKET_PROCESSED";
      ticketId: string;
      contactName: string;
      contactEmail: string;
      communeName?: string | null;
    };

export type Activity = {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO date string
  user: ActivityUser;
  metadata: ActivityMetadata;
};

export type ActivitiesResponse = {
  activities: Activity[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  USER_LOGIN: "Connexion utilisateur",
  CONTRIBUTION_CREATED: "Création de contribution",
  CONTRIBUTION_CLOSED: "Clôture de contribution",
  CONTRIBUTION_UPDATED: "Mise à jour de contribution",
  CITY_AUDIT: "Modification de commune",
  CONTACT_TICKET_PROCESSED: "Traitement de ticket de contact",
};

export const ACTIVITY_TYPE_BADGES: Record<ActivityType, "info" | "success" | "warning" | "error"> = {
  USER_LOGIN: "info",
  CONTRIBUTION_CREATED: "success",
  CONTRIBUTION_CLOSED: "success",
  CONTRIBUTION_UPDATED: "warning",
  CITY_AUDIT: "info",
  CONTACT_TICKET_PROCESSED: "success",
};

export const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  "USER_LOGIN",
  "CONTRIBUTION_CREATED",
  "CONTRIBUTION_CLOSED",
  "CONTRIBUTION_UPDATED",
  "CITY_AUDIT",
  "CONTACT_TICKET_PROCESSED",
];

