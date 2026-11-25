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

const STORAGE_KEY = 'nitsuh_role_permissions';

export function getRolePermissions(): Record<AppRole, RoleConfig> {
  if (typeof window === 'undefined') return DEFAULT_ROLE_PERMISSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_PERMISSIONS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
  } catch {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}

export function saveRolePermissions(permissions: Record<AppRole, RoleConfig>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  window.dispatchEvent(new Event('nitsuh_permissions_updated'));
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
