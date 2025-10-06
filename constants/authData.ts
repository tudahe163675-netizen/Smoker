export enum Role {
  USER = 'user',
  BAR_OWNER = 'bar_owner',
  DJ = 'dj',
  DANCER = 'dancer',
}

export interface AuthState {
  isAuthenticated: boolean;
  userEmail?: string;
  role?: Role;
  token?: string;
}

export const AUTH_CONSTANTS = {
  STORAGE_KEYS: {
    USER_EMAIL: 'userEmail',
    TOKEN: 'token',
    ROLE: 'role',
  },
  DEFAULT_ROLE: Role.USER,
  ROLES: [
    Role.USER,
    Role.BAR_OWNER,
    Role.DJ,
    Role.DANCER,
  ],
  FAKE_USERS: [
    { email: 'user', password: '123', role: Role.USER },
    { email: 'bar', password: '123', role: Role.BAR_OWNER },
    { email: 'dj', password: '123', role: Role.DJ },
    { email: 'dancer', password: '123', role: Role.DANCER },
  ],
};