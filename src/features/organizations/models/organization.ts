export interface Organization {
  id: string;
  name: string;
  registrationNumber: string;
  ownerEmail: string;
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  reviewNote: string | null;
  employeeLimit: number;
  driverLimit: number | null;
}
