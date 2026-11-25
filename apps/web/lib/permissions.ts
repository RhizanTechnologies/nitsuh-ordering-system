export type AppRole =
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'HEAD_CHEF'
  | 'KITCHEN_STAFF'
  | 'MAIN_STOREKEEPER'
  | 'KITCHEN_STOREKEEPER';

export type AppPage =
  | 'profit'
  | 'staff'
  | 'products'
  | 'inventory'
  | 'tables'
  | 'pos'
  | 'kds'
  | 'waiter';

export type AppCapability =
  | 'cancel_orders'
  | 'apply_discounts'
  | 'adjust_stock'
  | 'reset_pins';

export interface RoleConfig {
  label: string;
  pages: AppPage[];
  capabilities: AppCapability[];
}

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, RoleConfig> = {
  OWNER: {
    label: 'Owner / General Director',
    pages: ['profit', 'staff', 'products', 'inventory', 'tables', 'pos', 'kds', 'waiter'],
    capabilities: ['cancel_orders', 'apply_discounts', 'adjust_stock', 'reset_pins'],
  },
  MANAGER: {
    label: 'Operations Manager',
    pages: ['profit', 'staff', 'products', 'inventory', 'tables', 'pos', 'kds', 'waiter'],
    capabilities: ['cancel_orders', 'apply_discounts', 'adjust_stock', 'reset_pins'],
  },
  CASHIER: {
    label: 'Cashier Station',
    pages: ['pos'],
    capabilities: ['apply_discounts'],
  },
  WAITER: {
    label: 'Floor Waiter',
    pages: ['waiter'],
    capabilities: [],
  },
  HEAD_CHEF: {
    label: 'Head Chef',
    pages: ['kds', 'products', 'inventory'],
    capabilities: ['adjust_stock'],
  },
  KITCHEN_STAFF: {
    label: 'Kitchen Line Cook',
    pages: ['kds'],
    capabilities: [],
  },
  MAIN_STOREKEEPER: {
    label: 'Main Storekeeper',
    pages: ['inventory'],
    capabilities: ['adjust_stock'],
  },
  KITCHEN_STOREKEEPER: {
    label: 'Kitchen Storekeeper',
    pages: ['inventory', 'kds'],
    capabilities: ['adjust_stock'],
  },
};

import { fetchApi } from '@/lib/api';

const STORAGE_KEY = 'nitsuh_role_permissions';

let inMemoryPermissions: Record<AppRole, RoleConfig> | null = null;

export function getRolePermissions(): Record<AppRole, RoleConfig> {
  if (inMemoryPermissions) return inMemoryPermissions;
  if (typeof window === 'undefined') return DEFAULT_ROLE_PERMISSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_PERMISSIONS;
    const parsed = JSON.parse(raw);
    inMemoryPermissions = { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
    return inMemoryPermissions;
  } catch {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}

export function setLocalRolePermissions(permissions: Record<AppRole, RoleConfig>) {
  inMemoryPermissions = { ...DEFAULT_ROLE_PERMISSIONS, ...permissions };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryPermissions));
    window.dispatchEvent(new Event('nitsuh_permissions_updated'));
  }
}

export async function fetchServerRolePermissions(): Promise<Record<AppRole, RoleConfig>> {
  try {
    const data = await fetchApi('/users/permissions');
    if (data && typeof data === 'object') {
      setLocalRolePermissions(data);
      return inMemoryPermissions || DEFAULT_ROLE_PERMISSIONS;
    }
  } catch (e) {
    // Fallback to local
  }
  return getRolePermissions();
}

export async function saveRolePermissions(permissions: Record<AppRole, RoleConfig>) {
  setLocalRolePermissions(permissions);
  try {
    await fetchApi('/users/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
  } catch (e) {
    console.error('Failed to sync permissions to server:', e);
  }
}

export function canRoleAccessPage(role: string | undefined, page: AppPage): boolean {
  if (!role) return false;
  const normRole = role.toUpperCase() as AppRole;
  if (normRole === 'OWNER') return true;
  const perms = getRolePermissions();
  const config = perms[normRole];
  if (!config) return false;
  return config.pages.includes(page);
}

export function canRolePerformAction(role: string | undefined, cap: AppCapability): boolean {
  if (!role) return false;
  const normRole = role.toUpperCase() as AppRole;
  if (normRole === 'OWNER') return true;
  const perms = getRolePermissions();
  const config = perms[normRole];
  if (!config) return false;
  return config.capabilities.includes(cap);
}
