export interface AdministrativeUnit {
  code: string;
  name: string;
  datasetId: string;
  provinceCode?: string;
}
export interface LocationInput {
  name: string;
  type: string;
  datasetId: string;
  provinceCode: string;
  wardCode: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  accessInstructions: string;
  reason: string;
  confirmationMethod?: string;
}
export interface SharedLocation extends Omit<LocationInput, 'reason' | 'accessInstructions'> {
  id: string;
  version: number;
  isActive: boolean;
  accessInstructions: string | null;
}
export interface LocationVersion extends Omit<SharedLocation, 'id'> {
  locationId: string;
  reason: string;
  changedAt: string;
  changedBy: string;
}
export interface LocationRequest extends Partial<LocationInput> {
  id: string;
  status: string;
  kind: string;
  version: number;
  locationId?: string;
  baseVersion?: number;
  reviewReason?: string;
}
