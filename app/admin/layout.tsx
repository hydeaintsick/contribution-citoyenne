"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return (
      <div className="admin-shell admin-shell--login">
        <div className="admin-shell-container fr-container fr-py-10w fr-grid-row fr-grid-row--center">
          <main className="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <div className="fr-p-4w fr-background-raised--grey fr-radius--md">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell admin-shell--default">
      <div className="admin-shell-container fr-container fr-py-8w">
        <main className="fr-p-6w fr-background-alt--grey fr-radius--md">{children}</main>
      </div>
    </div>
  );
}

