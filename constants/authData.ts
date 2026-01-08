export enum Role {
  CUSTOMER = 'customer',
  BAR_OWNER = 'bar_owner',
  DJ = 'dj',
  DANCER = 'dancer',
}

export interface AuthState {
  isAuthenticated: boolean;
  userEmail?: string;
  role?: string;
  currentId?: string;
  token?: string;
  type?: string;
  avatar?: string;
  EntityAccountId?: string;
  entities: UserEntity[];
}

export interface UserEntity {
  EntityAccountId: string;
  avatar: string;
  id: string;
  name: string;
  role: string;
  type: "Account" | "BusinessAccount";
  status?: string;
}

