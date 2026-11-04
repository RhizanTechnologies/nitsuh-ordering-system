import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('cafe_theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') return saved;
    const attr = document.documentElement.getAttribute('data-theme') as ThemeMode;
    if (attr === 'light' || attr === 'dark') return attr;
  } catch (e) {}
  return 'dark';
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cafe_theme', theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.remove('theme-dark', 'dark');
      root.classList.add('theme-light', 'light');
    } else {
      root.classList.remove('theme-light', 'light');
      root.classList.add('theme-dark', 'dark');
    }
  } catch (e) {}
};

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF' | 'MAIN_STOREKEEPER' | 'KITCHEN_STOREKEEPER' | 'HEAD_CHEF';
  avatarUrl?: string;
  pinCode?: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  tip?: number; // Tip added on base price of each product
  quantity: number;
  specialInstructions?: string;
  imageUrl?: string;
  isDirectSale?: boolean;
}

interface AppState {
  currentUser: StaffUser | null;
  authToken: string | null;
  activeView: 'pos' | 'waiter' | 'kds' | 'inventory' | 'analytics';
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  selectedTable: string;
  customerName: string;
  cart: CartItem[];
  waiterCart: CartItem[];
  waiterTable: string;
  waiterCustomerName: string;
  waiterSpecialNotes: string;
  waiterSlipsCount: number;
  tableManagerOpen: boolean;
  theme: ThemeMode;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  login: (token: string, user: StaffUser) => void;
  logout: () => void;
  setCurrentUser: (user: StaffUser) => void;
  setActiveView: (view: 'pos' | 'waiter' | 'kds' | 'inventory' | 'analytics') => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  setSelectedTable: (table: string) => void;
  setCustomerName: (name: string) => void;
  setTableManagerOpen: (open: boolean) => void;

  // POS Cart Actions
  addToCart: (item: { id: string; name: string; price: number; imageUrl?: string; isDirectSale?: boolean }) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  setItemTip: (menuItemId: string, tip: number) => void;
  setItemNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;

  // Waiter Pad Cart Actions
  addToWaiterCart: (item: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    quantity?: number;
    specialInstructions?: string;
  }) => void;
  updateWaiterQuantity: (menuItemId: string, delta: number) => void;
  setWaiterItemTip: (menuItemId: string, tip: number) => void;
  setWaiterTable: (table: string) => void;
  setWaiterCustomerName: (name: string) => void;
  setWaiterSpecialNotes: (notes: string) => void;
  clearWaiterCart: () => void;
  setWaiterSlipsCount: (count: number) => void;
}

// Quick staff list for touch PIN login reference
export const KNOWN_STAFF = [
  { name: 'John Holland', role: 'MANAGER', pin: '1111', desc: 'Manager (Operations Oversight, Waiter & Main Storekeeper)' },
  { name: 'Samantha W', role: 'CASHIER', pin: '1234', desc: 'Cashier Terminal (POS, Tables, Payments)' },
  { name: 'Abel Tesfaye', role: 'WAITER', pin: '2222', desc: 'Waiter Mobile Pad (Table Ordering)' },
  { name: 'Sara K', role: 'WAITER', pin: '3333', desc: 'Waiter Mobile Pad (Table Ordering)' },
  { name: 'Chef Dawit', role: 'KITCHEN_STAFF', pin: '4444', desc: 'Kitchen Display System (Cooking Queue Only)' },
  { name: 'Michael', role: 'MAIN_STOREKEEPER', pin: '5555', desc: 'Main Store Warehouse (Purchases & Transfers Only)' },
  { name: 'Chef Tigist', role: 'HEAD_CHEF', pin: '6666', desc: 'Head Chef (KDS Live + Verify Stock Transfers)' },
  { name: 'Adam S', role: 'OWNER', pin: '0000', desc: 'Owner Executive Portal (Full Analytics & Settings)' },
];

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  authToken: null,
  activeView: 'pos',
  orderType: 'DINE_IN',
  selectedTable: 'B12 - Indoor',
  customerName: 'Muadz',
  cart: [],
  waiterCart: [],
  waiterTable: 'B12 - Indoor',
  waiterCustomerName: '',
  waiterSpecialNotes: '',
  waiterSlipsCount: 0,
  tableManagerOpen: false,
  theme: getInitialTheme(),
  setTableManagerOpen: (open) => set({ tableManagerOpen: open }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const current = typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-theme') as ThemeMode) || state.theme
        : state.theme;
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      return { theme: nextTheme };
    });
  },

  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cafe_token', token);
      localStorage.setItem('cafe_user', JSON.stringify(user));
    }
    // Set appropriate landing page per role
    let defaultView: 'pos' | 'waiter' | 'kds' | 'inventory' | 'analytics' = 'pos';
    if (user.role === 'WAITER') defaultView = 'waiter';
    else if (user.role === 'KITCHEN_STAFF') defaultView = 'kds';
    else if (user.role === 'HEAD_CHEF') defaultView = 'kds';
    else if (user.role === 'MAIN_STOREKEEPER' || user.role === 'KITCHEN_STOREKEEPER') defaultView = 'inventory';
    else if (user.role === 'OWNER' || user.role === 'MANAGER') defaultView = 'analytics';

    set({ currentUser: user, authToken: token, activeView: defaultView });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cafe_token');
      localStorage.removeItem('cafe_user');
    }
    set({ currentUser: null, authToken: null, cart: [], waiterCart: [] });
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveView: (view) => set({ activeView: view }),
  setOrderType: (type) => set({ orderType: type }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setCustomerName: (name) => set({ customerName: name }),

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.menuItemId === item.id);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl,
            isDirectSale: item.isDirectSale,
          },
        ],
      };
    }),

  removeFromCart: (menuItemId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.menuItemId !== menuItemId),
    })),

  updateQuantity: (menuItemId, delta) =>
    set((state) => {
      const updated = state.cart
        .map((c) => {
          if (c.menuItemId === menuItemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
      return { cart: updated };
    }),

  setItemTip: (menuItemId, tip) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.menuItemId === menuItemId ? { ...c, tip: Math.max(0, tip) } : c,
      ),
    })),

  setItemNotes: (menuItemId, notes) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.menuItemId === menuItemId ? { ...c, specialInstructions: notes } : c,
      ),
    })),

  clearCart: () => set({ cart: [] }),

  addToWaiterCart: (item) =>
    set((state) => {
      const addQty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const existing = state.waiterCart.find((c) => c.menuItemId === item.id);
      if (existing) {
        return {
          waiterCart: state.waiterCart.map((c) =>
            c.menuItemId === item.id
              ? {
                  ...c,
                  quantity: c.quantity + addQty,
                  specialInstructions: item.specialInstructions || c.specialInstructions,
                }
              : c,
          ),
        };
      }
      return {
        waiterCart: [
          ...state.waiterCart,
          {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: addQty,
            imageUrl: item.imageUrl,
            specialInstructions: item.specialInstructions,
          },
        ],
      };
    }),

  updateWaiterQuantity: (menuItemId, delta) =>
    set((state) => {
      const updated = state.waiterCart
        .map((c) => {
          if (c.menuItemId === menuItemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
      return { waiterCart: updated };
    }),

  setWaiterItemTip: (menuItemId, tip) =>
    set((state) => ({
      waiterCart: state.waiterCart.map((c) =>
        c.menuItemId === menuItemId ? { ...c, tip: Math.max(0, tip) } : c,
      ),
    })),

  setWaiterTable: (table) => set({ waiterTable: table }),
  setWaiterCustomerName: (name) => set({ waiterCustomerName: name }),
  setWaiterSpecialNotes: (notes) => set({ waiterSpecialNotes: notes }),
  clearWaiterCart: () => set({ waiterCart: [], waiterSpecialNotes: '' }),
  setWaiterSlipsCount: (count) => set({ waiterSlipsCount: count }),
}));
