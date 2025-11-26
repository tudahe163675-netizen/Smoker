export type AccountType = 'personal' | 'dj' | 'bar';

export interface Account {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: AccountType;
  typeLabel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequestData {
  type: AccountType;
  name: string;
  email: string;
  phone?: string;
  avatar?: UploadFile;
  // Specific fields for DJ account
  djName?: string;
  genre?: string[];
  // Specific fields for Bar account
  barName?: string;
  address?: string;
  description?: string;
}

export interface SwitchAccountRequestData {
  accountId: string;
}

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface AccountListResponse {
  accounts: Account[];
  currentAccountId: string;
}