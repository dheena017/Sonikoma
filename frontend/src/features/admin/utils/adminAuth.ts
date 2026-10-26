/**
 * Admin authorization and role validation utilities
 */

export interface AdminUserRoleCheck {
  creator_role?: string;
  role?: string;
  is_admin?: boolean;
}

/**
 * Checks whether a user possesses administrative privileges.
 */
export const isUserAdmin = (user?: AdminUserRoleCheck | null): boolean => {
  if (!user) return false;
  return (
    user.creator_role === "admin" ||
    user.role === "admin" ||
    user.is_admin === true
  );
};

/**
 * Promotes the currently logged-in session user to admin (used in dev/sandbox environments).
 */
export const selfPromoteToAdmin = async (): Promise<boolean> => {
  try {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    const res = await fetch("/api/v1/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ creator_role: "admin" }),
    });
    return res.ok;
  } catch (e) {
    console.error("Error self-promoting to admin:", e);
    return false;
  }
};
