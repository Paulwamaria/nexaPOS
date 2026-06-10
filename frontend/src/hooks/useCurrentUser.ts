"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export function useCurrentUser() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get("/auth/me/");
        setUser(res.data);
      } catch {
        logout();
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, [router]);

  return {
    user,
    loadingUser,
  };
}
