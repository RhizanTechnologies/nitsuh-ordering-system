export type UserRole =
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN_STAFF'
  | 'MAIN_STOREKEEPER'
  | 'KITCHEN_STOREKEEPER'
  | 'HEAD_CHEF';

export interface RouteConfig {
  path: string;
  label: string;
  allowedRoles: UserRole[];
  icon: string;
  badge?: string;
}

export const STATION_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    label: 'Analytics & Profit',
    allowedRoles: ['OWNER'], // Strictly restricted to OWNER; Manager cannot see financial profit
    icon: 'BarChart3',
  },
  {
    path: '/pos',
    label: 'POS Cashier',
    allowedRoles: ['CASHIER', 'OWNER', 'MANAGER'],
    icon: 'MonitorCheck',
  },
  {
    path: '/waiter',
    label: 'Waiter Order Pad',
    allowedRoles: ['WAITER', 'OWNER', 'MANAGER'],
    icon: 'Smartphone',
  },
  {
    path: '/kds',
    label: 'Kitchen Display',
    allowedRoles: ['KITCHEN_STAFF', 'HEAD_CHEF', 'KITCHEN_STOREKEEPER', 'OWNER', 'MANAGER'],
    icon: 'ChefHat',
  },
  {
    path: '/inventory',
    label: 'Dual Inventory & Recipes',
    allowedRoles: ['MAIN_STOREKEEPER', 'KITCHEN_STOREKEEPER', 'HEAD_CHEF', 'OWNER', 'MANAGER'],
    icon: 'Boxes',
  },
  {
    path: '/tables',
    label: 'Tables Floor Plan',
    allowedRoles: ['OWNER', 'MANAGER'],
    icon: 'LayoutGrid',
  },
];

export function getDefaultRouteForRole(role?: UserRole | null): string {
  if (!role) return '/login';
  switch (role) {
    case 'WAITER':
      return '/waiter';
    case 'CASHIER':
      return '/pos';
    case 'KITCHEN_STAFF':
    case 'HEAD_CHEF':
      return '/kds';
    case 'MAIN_STOREKEEPER':
    case 'KITCHEN_STOREKEEPER':
      return '/inventory';
    case 'MANAGER':
      return '/tables';
    case 'OWNER':
    default:
      return '/dashboard';
  }
}

export function isRouteAllowed(path: string, role?: UserRole | null): boolean {
  if (!role) return false;
  // If user is OWNER, allow all station routes
  if (role === 'OWNER') return true;

  // Manager is strictly prohibited from seeing profit & financial analytics
  if (role === 'MANAGER' && (path === '/dashboard' || path.startsWith('/dashboard/'))) {
    return false;
  }

  const matchedRoute = STATION_ROUTES.find(
    (r) => path === r.path || path.startsWith(r.path + '/')
  );

  if (!matchedRoute) return true; // public or unmapped route
  return matchedRoute.allowedRoles.includes(role);
}

export function getAllowedRoutesForRole(role?: UserRole | null): RouteConfig[] {
  if (!role) return [];
  return STATION_ROUTES.filter((route) => route.allowedRoles.includes(role));
}
