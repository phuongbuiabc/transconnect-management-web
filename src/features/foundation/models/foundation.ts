import type { PagedResult } from '../../../core/api/contracts';
export type Page<T> = PagedResult<T>;
export interface Driver {
  id: string;
  accountId: string;
  fullName: string;
  reviewStatus: string;
  reviewNote: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  isProfileComplete: boolean;
}
export interface Review {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}
export interface Membership {
  organizationId: string;
  organizationName: string;
  role: string;
  isActive: boolean;
  employeeLimit: number;
  driverLimit: number | null;
  employeeOccupancy: number;
  driverOccupancy: number;
  capabilities: string[];
}
export interface Context {
  memberships: Membership[];
  driverId: string | null;
  driverStatus: string | null;
}
export interface EngagementContact {
  fullName: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  isHistorical: boolean;
  capturedAt: string | null;
  snapshotAvailable: boolean;
}
export interface Member {
  id: string;
  accountId: string;
  fullName: string;
  role: string;
  isActive: boolean;
}
export interface Engagement {
  id: string;
  driverId: string;
  fullName: string;
  expiresAt: string;
  acceptedAt: string | null;
  endedAt: string | null;
  revokedAt: string | null;
}
export interface Invitation {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}
export interface Vehicle {
  linkId: string;
  vehicleId: string;
  registrationPlate: string;
  description: string | null;
  isSuspended: boolean;
  endedAt: string | null;
  vehicleKind: string | null;
  seatCount: number | null;
  permittedPayloadKg: number | null;
}
export interface ProfileVersion {
  profileDocumentId: string;
  subjectType: string;
  subjectId: string;
  documentType: string;
  versionNumber: number;
  file: { id: string; status: string; verification: string; notice: string };
}
