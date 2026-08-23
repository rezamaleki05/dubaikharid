import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export const ADMIN_ROUTES = {
  overview: '/admin/dashboard',
  orders: '/admin/orders',
  leads: '/admin/leads',
  products: '/admin/products',
  warehouse: '/admin/warehouse',
  stock_laptops: '/admin/laptops',
  customers: '/admin/customers',
  payments: '/admin/payments',
  shipments: '/admin/shipments',
  financial_reports: '/admin/financial-reports',
  brands: '/admin/brands',
  stores: '/admin/stores',
  categories: '/admin/categories',
  settings: '/admin/settings',
  admin_users: '/admin/admin-users',
  activity_logs: '/admin/activity-logs'
};

export const ADMIN_ROUTE_PERMISSIONS = Object.freeze({
  [ADMIN_ROUTES.overview]: ADMIN_PERMISSIONS.DASHBOARD_VIEW,
  [ADMIN_ROUTES.orders]: ADMIN_PERMISSIONS.ORDERS_VIEW,
  [ADMIN_ROUTES.leads]: ADMIN_PERMISSIONS.PURCHASE_REQUESTS_VIEW,
  [ADMIN_ROUTES.products]: ADMIN_PERMISSIONS.PRODUCTS_VIEW,
  [ADMIN_ROUTES.warehouse]: ADMIN_PERMISSIONS.WAREHOUSE_VIEW,
  [ADMIN_ROUTES.stock_laptops]: ADMIN_PERMISSIONS.LAPTOPS_VIEW,
  [ADMIN_ROUTES.customers]: ADMIN_PERMISSIONS.CUSTOMERS_VIEW,
  [ADMIN_ROUTES.payments]: ADMIN_PERMISSIONS.PAYMENTS_VIEW,
  [ADMIN_ROUTES.shipments]: ADMIN_PERMISSIONS.SHIPMENTS_VIEW,
  [ADMIN_ROUTES.financial_reports]: ADMIN_PERMISSIONS.FINANCIAL_REPORTS_VIEW,
  [ADMIN_ROUTES.brands]: ADMIN_PERMISSIONS.BRANDS_MANAGE,
  [ADMIN_ROUTES.stores]: ADMIN_PERMISSIONS.STORES_MANAGE,
  [ADMIN_ROUTES.categories]: ADMIN_PERMISSIONS.CATEGORIES_MANAGE,
  [ADMIN_ROUTES.settings]: ADMIN_PERMISSIONS.SETTINGS_VIEW,
  [ADMIN_ROUTES.admin_users]: ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE,
  [ADMIN_ROUTES.activity_logs]: ADMIN_PERMISSIONS.ACTIVITY_LOGS_VIEW,
});
