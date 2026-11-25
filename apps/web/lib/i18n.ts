'use client';

import { useState, useEffect } from 'react';

export type Language = 'en' | 'am';

export const translations = {
  en: {
    // Nav items
    nav_profit: 'Profit',
    nav_staff: 'Staff',
    nav_stock: 'Stock',
    nav_menu: 'Menu',
    nav_tables: 'Tables',
    nav_pos: 'POS',
    nav_kds: 'KDS',
    nav_waiter: 'Waiter',
    nav_logout: 'Sign Out & Lock Terminal',
    nav_change_creds: 'Change Password / PIN',

    // Waiter View
    waiter_all_menu: 'All Menu',
    waiter_dine_in: 'Dine In',
    waiter_takeaway: 'Takeaway',
    waiter_select_table: 'Select Dining Table',
    waiter_change_table: 'Change',
    waiter_order_details: 'Order Details',
    waiter_no_order: 'No Order',
    waiter_select_items: 'Select items to add to order',
    waiter_special_notes: 'Special instructions (e.g. Less spicy, extra sauce)...',
    waiter_takeaway_placeholder: 'Takeaway customer name...',
    waiter_review_slip: 'Review Slip',
    waiter_send_to_cashier: 'Send to Cashier',
    waiter_update_order: 'Update Order',
    waiter_cancel_edit: 'Cancel Edit',
    waiter_editing_draft: 'Editing Draft Note',
    waiter_adding_items: 'Adding Items',
    waiter_clear_order: 'Clear All Order',
    waiter_total: 'Total',
    waiter_subtotal: 'Subtotal',
    waiter_tax_inc: 'Tax (15% VAT included in price)',
    waiter_items: 'items',
    waiter_item: 'item',
    waiter_in_order: 'in order',
    waiter_live_status: 'Live Status',
    waiter_kitchen_status: 'Kitchen Status',
    waiter_menu_tab: 'Menu',
    waiter_tracker_tab: 'Kitchen Tracker',

    // POS View
    pos_tender: 'Process Tender',
    pos_cash: 'Cash',
    pos_telebirr: 'Telebirr',
    pos_cbe: 'CBE Birr',
    pos_bank: 'Bank Transfer',
    pos_amount_paid: 'Amount Paid',
    pos_change: 'Change',
    pos_discount: 'Discount',
    pos_tip: 'Tip',
    pos_confirm_payment: 'Confirm Payment',
    pos_active_orders: 'Active Orders',
    pos_active_slips: 'Active Waiter Slips',
    pos_tables_plan: 'Dining Tables',
    pos_draft_note: 'Draft Note',
    pos_held_order: 'Held',

    // Menu Studio & Products
    menu_studio: 'Menu Studio & Recipes',
    menu_products: 'Products',
    menu_addons: 'Add-ons',
    menu_add_product: 'Add Product',
    menu_add_category: 'Category',
    menu_manage_categories: 'Manage Categories',
    menu_search_placeholder: 'Search products...',
    menu_grid: 'Grid',
    menu_list: 'List (1 Per Row)',
    menu_showing: 'Showing',
    menu_per_page: 'Per page:',
    menu_page: 'Page',
    menu_of: 'of',
    menu_previous: '← Previous',
    menu_next: 'Next →',
    menu_edit: 'Edit',
    menu_delete: 'Delete',
    menu_save: 'Save',
    menu_cancel: 'Cancel',

    // Tables & Floor Plan
    tables_title: 'Dining Tables & Floor Plan',
    tables_subtitle: 'Select a dining table',
    tables_open: 'Open',
    tables_seated: 'Seated',
    tables_reserved: 'Reserved',
    tables_capacity: 'Capacity',
    tables_seats: 'seats',
    tables_free: 'Free',
    tables_add_table: 'Add Table',
    tables_floor_view: 'Floor Plan View',
    tables_manage_tables: 'Manage Tables',

    // Inventory
    inv_title: 'Inventory & Stock',
    inv_production: 'Kitchen Production',
    inv_transfers: 'Transfers',
    inv_wastage: 'Wastage',
    inv_ledger: 'Ledger',
    inv_recipes: 'Recipes',
    inv_suppliers: 'Suppliers',

    // Analytics / Profit
    profit_title: 'Operations & Profit',
    profit_analytics: 'Financial Analytics',
    profit_studio: 'Products Studio',
    profit_total_revenue: 'Total Revenue',
    profit_net_profit: 'Estimated Net Profit',
    profit_cogs: 'Production COGS',
    profit_total_orders: 'Total Orders',
    profit_available_tables: 'Available Tables',
    profit_export_csv: 'Export CSV',
    profit_day: 'DAY',
    profit_week: 'WEEK',
    profit_month: 'MONTH',
    profit_year: 'YEAR',

    // General
    loading: 'Loading...',
    search: 'Search...',
    active: 'Active',
    paused: 'Paused',
    status: 'Status',
  },
  am: {
    // Nav items
    nav_profit: 'ትርፍ',
    nav_staff: 'ሰራተኞች',
    nav_stock: 'እቃ ክምችት',
    nav_menu: 'ሜኑ',
    nav_tables: 'ጠረጴዛዎች',
    nav_pos: 'ካሸር',
    nav_kds: 'ማብሰያ ቤት',
    nav_waiter: 'አስተናጋጅ',
    nav_logout: 'ውጣ እና ተርሚናሉን ቆልፍ',
    nav_change_creds: 'የይለፍ ቃል / ፒን ቀይር',

    // Waiter View
    waiter_all_menu: 'ሙሉ ሜኑ',
    waiter_dine_in: 'እዚህ መመገብ',
    waiter_takeaway: 'ይዘው መሄድ',
    waiter_select_table: 'ጠረጴዛ ይምረጡ',
    waiter_change_table: 'ቀይር',
    waiter_order_details: 'የትዕዛዝ ዝርዝር',
    waiter_no_order: 'ምንም ትዕዛዝ የለም',
    waiter_select_items: 'ከሜኑ ምርቶችን ይምረጡ',
    waiter_special_notes: 'ልዩ ማስታወሻ (ለምሳሌ፡ ስኳር ሳይበዛበት፣ አሪፍ ትኩስ)...',
    waiter_takeaway_placeholder: 'የደንበኛ ስም...',
    waiter_review_slip: 'ትዕዛዝ ማጠቃለያ',
    waiter_send_to_cashier: 'ወደ ካሸር ላክ',
    waiter_update_order: 'ትዕዛዝ አድስ',
    waiter_cancel_edit: 'አርትዖት ሰርዝ',
    waiter_editing_draft: 'ረቂቅ ማስታወሻ በማረም ላይ',
    waiter_adding_items: 'ምርቶችን በመጨመር ላይ',
    waiter_clear_order: 'ሙሉውን አጽዳ',
    waiter_total: 'ጠቅላላ ድምር',
    waiter_subtotal: 'ንዑስ ድምር',
    waiter_tax_inc: 'ታክስ (15% ቫት ተካትቷል)',
    waiter_items: 'ምርቶች',
    waiter_item: 'ምርት',
    waiter_in_order: 'በትዕዛዙ ውስጥ',
    waiter_live_status: 'የቀጥታ ሁኔታ',
    waiter_kitchen_status: 'የኩሽና ሁኔታ',
    waiter_menu_tab: 'ምግብ ሜኑ',
    waiter_tracker_tab: 'የትዕዛዝ ሁኔታ',

    // POS View
    pos_tender: 'ክፍያ ተቀበል',
    pos_cash: 'ጥሬ ገንዘብ',
    pos_telebirr: 'ቴሌብር',
    pos_cbe: 'ሲቢኢ ብር',
    pos_bank: 'የባንክ ዝውውር',
    pos_amount_paid: 'የተከፈለ ገንዘብ',
    pos_change: 'መልስ',
    pos_discount: 'ቅናሽ',
    pos_tip: 'ቲፕ',
    pos_confirm_payment: 'ክፍያ አረጋግጥ',
    pos_active_orders: 'ንቁ ትዕዛዞች',
    pos_active_slips: 'የአስተናጋጅ ማስታወሻዎች',
    pos_tables_plan: 'የመመገቢያ ጠረጴዛዎች',
    pos_draft_note: 'ረቂቅ ማስታወሻ',
    pos_held_order: 'የተያዘ',

    // Menu Studio & Products
    menu_studio: 'ሜኑ ስቱዲዮ እና አሰራር',
    menu_products: 'ምርቶች',
    menu_addons: 'ተጨማሪዎች',
    menu_add_product: 'ምርት ጨምር',
    menu_add_category: 'ምድብ',
    menu_manage_categories: 'ምድቦችን አስተዳድር',
    menu_search_placeholder: 'ምርቶችን ፈልግ...',
    menu_grid: 'ሰንጠረዥ',
    menu_list: 'ዝርዝር (በአንድ ረድፍ)',
    menu_showing: 'በማሳየት ላይ',
    menu_per_page: 'በአንድ ገጽ:',
    menu_page: 'ገጽ',
    menu_of: 'ከ',
    menu_previous: '← ቀዳሚ',
    menu_next: 'ቀጣይ →',
    menu_edit: 'አርትዕ',
    menu_delete: 'ሰርዝ',
    menu_save: 'አስቀምጥ',
    menu_cancel: 'ተመለስ',

    // Tables & Floor Plan
    tables_title: 'የመመገቢያ ጠረጴዛዎች እና ፕላን',
    tables_subtitle: 'ጠረጴዛ ይምረጡ',
    tables_open: 'ክፍት',
    tables_seated: 'የተያዘ',
    tables_reserved: 'የተያዘ',
    tables_capacity: 'መያዝ የሚችለው',
    tables_seats: 'ወንበሮች',
    tables_free: 'ልቀቅ',
    tables_add_table: 'ጠረጴዛ ጨምር',
    tables_floor_view: 'የወለል ፕላን',
    tables_manage_tables: 'ጠረጴዛዎችን አስተዳድር',

    // Inventory
    inv_title: 'እቃ ግምጃ ቤት እና ክምችት',
    inv_production: 'የኩሽና ምርት',
    inv_transfers: 'ዝውውር',
    inv_wastage: 'ብክነት',
    inv_ledger: 'የሂሳብ መዝገብ',
    inv_recipes: 'አዘገጃጀት',
    inv_suppliers: 'አቅራቢዎች',

    // Analytics / Profit
    profit_title: 'የስራ እንቅስቃሴ እና ትርፍ',
    profit_analytics: 'የፋይናንስ ትንተና',
    profit_studio: 'የምርቶች ስቱዲዮ',
    profit_total_revenue: 'ጠቅላላ ገቢ',
    profit_net_profit: 'የተጣራ ትርፍ',
    profit_cogs: 'የምርት ወጪ',
    profit_total_orders: 'ጠቅላላ ትዕዛዞች',
    profit_available_tables: 'ክፍት ጠረጴዛዎች',
    profit_export_csv: 'CSV አውርድ',
    profit_day: 'ቀን',
    profit_week: 'ሳምንት',
    profit_month: 'ወር',
    profit_year: 'ዓመት',

    // General
    loading: 'በመጫን ላይ...',
    search: 'ፈልግ...',
    active: 'ንቁ',
    paused: 'የቆመ',
    status: 'ሁኔታ',
  },
};

export type TranslationKey = keyof typeof translations.en;

const LANG_STORAGE_KEY = 'nitsuh_lang';

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
  return saved === 'am' ? 'am' : 'en';
}

export function setLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('nitsuh_lang_changed', { detail: lang }));
  }
}

export function useTranslation() {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    setLangState(getLanguage());

    const handleLangChange = (e: any) => {
      if (e.detail) {
        setLangState(e.detail);
      } else {
        setLangState(getLanguage());
      }
    };

    window.addEventListener('nitsuh_lang_changed', handleLangChange);
    return () => window.removeEventListener('nitsuh_lang_changed', handleLangChange);
  }, []);

  const t = (key: TranslationKey, fallback?: string): string => {
    return translations[lang]?.[key] || translations.en[key] || fallback || key;
  };

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
  };

  return { lang, setLanguage, toggleLanguage, t };
}
