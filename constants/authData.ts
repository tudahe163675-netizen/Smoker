export enum Role {
  CUSTOMER = 'customer',
  BAR_OWNER = 'bar_owner',
  DJ = 'dj',
  DANCER = 'dancer',
}

export interface AuthState {
  isAuthenticated: boolean;
  userEmail?: string;
  role?: Role;
  currentId?: string;
  token?: string;
  type?: string;
  avatar?: string;
  EntityAccountId?: string;
}
