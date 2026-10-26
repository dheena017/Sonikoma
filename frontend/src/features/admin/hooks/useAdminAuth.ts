import { useMemo, useState } from "react";
import { isUserAdmin, selfPromoteToAdmin } from "../utils/adminAuth";

export function useAdminAuth(user?: any, isAuthenticated?: boolean) {
  const [promoting, setPromoting] = useState(false);

  const isAdmin = useMemo(() => {
    return isAuthenticated && isUserAdmin(user);
  }, [user, isAuthenticated]);

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const ok = await selfPromoteToAdmin();
      if (ok) {
        window.location.reload();
      } else {
        alert("Failed to self-promote to admin");
      }
    } catch {
      alert("Error self-promoting to admin");
    } finally {
      setPromoting(false);
    }
  };

  return {
    isAdmin,
    promoting,
    handlePromote,
  };
}
