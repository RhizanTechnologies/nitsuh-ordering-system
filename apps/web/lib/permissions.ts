export type AppRole =
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'HEAD_CHEF'
  | 'KITCHEN_STAFF'
  | 'MAIN_STOREKEEPER'
  | 'KITCHEN_STOREKEEPER'
  | string;

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
  description?: string;
  isCustom?: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RoleConfig> = {
  OWNER: {
    label: 'Owner / General Director',
    description: 'Universal administrative authority and settings access',
    pages: ['profit', 'staff', 'products', 'inventory', 'tables', 'pos', 'kds', 'waiter'],
    capabilities: ['cancel_orders', 'apply_discounts', 'adjust_stock', 'reset_pins'],
  },
  MANAGER: {
    label: 'Operations Manager',
    description: 'Floor supervision, staff administration, and operational reporting',
    pages: ['profit', 'staff', 'products', 'inventory', 'tables', 'pos', 'kds', 'waiter'],
    capabilities: ['cancel_orders', 'apply_discounts', 'adjust_stock', 'reset_pins'],
  },
  CASHIER: {
    label: 'Cashier Station',
    description: 'POS terminal checkout, payments, bills settlement, and receipts',
    pages: ['pos'],
    capabilities: ['apply_discounts'],
  },
  WAITER: {
    label: 'Floor Waiter',
    description: 'Dining table guest ordering pad and floor servicing',
    pages: ['waiter'],
    capabilities: [],
  },
  HEAD_CHEF: {
    label: 'Head Chef',
    description: 'Kitchen display oversight, recipe studio, and store requisitions',
    pages: ['kds', 'products', 'inventory'],
    capabilities: ['adjust_stock'],
  },
  KITCHEN_STAFF: {
    label: 'Kitchen Line Cook',
    description: 'Real-time order line preparation and kitchen ticket dispatch',
    pages: ['kds'],
    capabilities: [],
  },
  MAIN_STOREKEEPER: {
    label: 'Main Storekeeper',
    description: 'Bulk warehouse stock receipt, transfers, and inventory control',
    pages: ['inventory'],
    capabilities: ['adjust_stock'],
  },
  KITCHEN_STOREKEEPER: {
    label: 'Kitchen Storekeeper',
    description: 'Kitchen sub-store consumption, daily requisitions, and wastage',
    pages: ['inventory', 'kds'],
    capabilities: ['adjust_stock'],
  },
};

import { fetchApi } from '@/lib/api';

const STORAGE_KEY = 'nitsuh_role_permissions';

let inMemoryPermissions: Record<string, RoleConfig> | null = null;

export function getRolePermissions(): Record<string, RoleConfig> {
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

export function setLocalRolePermissions(permissions: Record<string, RoleConfig>) {
  inMemoryPermissions = {
    ...permissions,
    OWNER: DEFAULT_ROLE_PERMISSIONS.OWNER,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryPermissions));
    window.dispatchEvent(new Event('nitsuh_permissions_updated'));
  }
}

export async function fetchServerRolePermissions(): Promise<Record<string, RoleConfig>> {
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

export async function saveRolePermissions(permissions: Record<string, RoleConfig>) {
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
  const normRole = role.toUpperCase();
  if (normRole === 'OWNER') return true;
  const perms = getRolePermissions();
  const config = perms[normRole];
  if (!config) return false;
  return config.pages.includes(page);
}

export function canRolePerformAction(role: string | undefined, cap: AppCapability): boolean {
  if (!role) return false;
  const normRole = role.toUpperCase();
  if (normRole === 'OWNER') return true;
  const perms = getRolePermissions();
  const config = perms[normRole];
  if (!config) return false;
  return config.capabilities.includes(cap);
}
