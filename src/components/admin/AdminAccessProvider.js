'use client';

import { createContext, useContext } from 'react';

const AdminAccessContext = createContext({
  admin: null,
  permissions: [],
  can: () => false,
});

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}

export default function AdminAccessProvider({ admin, children }) {
  const permissions = Array.isArray(admin?.permissions) ? admin.permissions : [];
  const value = {
    admin,
    permissions,
    can: permission => permissions.includes(permission),
  };

  return (
    <AdminAccessContext.Provider value={value}>
      {children}
    </AdminAccessContext.Provider>
  );
}
