export interface User {
  accountGroup: string;
  accountId: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
}
