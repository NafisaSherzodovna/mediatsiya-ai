"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "cn";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { logout, useUser } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/labels";
import type { Role } from "@/lib/types";

const NAV: Record<Role, { href: string; label: string }[]> = {
  claimant: [
    { href: "/ishlar", label: "Ishlarim" },
    { href: "/murojaat", label: "Yangi murojaat" },
    { href: "/huquq", label: "Huquqiy yordamchi" },
  ],
  mediator: [{ href: "/mediator", label: "Ishlar" }],
  ministry: [{ href: "/vazirlik", label: "Statistika" }],
  admin: [
    { href: "/vazirlik", label: "Statistika" },
    { href: "/admin/", label: "Operator paneli" },
  ],
};

export function AppHeader() {
  const { user } = useUser();
  const path = usePathname();
  const router = useRouter();
  const nav = user ? NAV[user.role] : [];
  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="Bosh sahifa">
          <Logo />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink-wash hover:text-ink",
                path.startsWith(n.href) && "bg-ink-wash text-ink",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2.5 sm:flex">
                <Avatar name={user.name} className="size-9 text-xs" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink">{user.name}</p>
                  <p className="text-xs text-ink-soft">{ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Chiqish"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="size-[18px]" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/kirish">Kirish</Link>
            </Button>
          )}
        </div>
      </div>
      {nav.length > 0 && (
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "shrink-0 rounded-full border border-rule px-3 py-1.5 text-sm font-medium text-ink-soft",
                path.startsWith(n.href) && "border-ink bg-ink text-white",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

/** Client guard: sends visitors without the right role to /kirish. */
export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, ready } = useUser();
  const router = useRouter();
  const path = usePathname();
  const allowed = !!user && roles.includes(user.role);
  useEffect(() => {
    if (!ready || allowed) return;
    // signed in with another role: go to that role's home instead of bouncing to the login page
    router.replace(user ? ROLE_HOME[user.role] : `/kirish?next=${encodeURIComponent(path)}`);
  }, [ready, allowed, router, path, user]);
  if (!ready || !allowed) {
    return (
      <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-3 text-ink-soft">
        <span className="size-6 animate-spin rounded-full border-2 border-accord border-t-transparent" />
        <p className="text-sm">Yuklanmoqda…</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function AppShell({ roles, children, wide }: { roles: Role[]; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <AppHeader />
      <RequireRole roles={roles}>
        <main className={cn("mx-auto w-full flex-1 px-4 pt-6 pb-16 sm:pt-10", wide ? "max-w-6xl" : "max-w-3xl")}>{children}</main>
      </RequireRole>
    </>
  );
}
