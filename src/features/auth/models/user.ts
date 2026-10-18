export interface User {
  accountGroup: string;
  accountId: string;
  userId: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
}
