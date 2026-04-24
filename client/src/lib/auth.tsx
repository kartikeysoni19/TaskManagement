import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter } from "@/lib/api";
import { User, useGetMe, getGetMeQueryKey } from "@/lib/api";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("auth_token"));
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    queryClient.clear();
    setLocation("/login");
  };

  // Refresh user data if token exists
  const { data: me, isError } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (me) {
      setUser(me);
      localStorage.setItem("auth_user", JSON.stringify(me));
    }
  }, [me]);

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
