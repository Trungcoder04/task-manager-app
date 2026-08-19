export interface AuthenticatedUser {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  [key: string]: any;
}
