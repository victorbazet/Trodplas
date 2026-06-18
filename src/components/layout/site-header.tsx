import Link from "next/link";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { APP_NAME } from "@/lib/constants";

/**
 * Server component: reads the auth session and renders the top nav.
 * The interactive user dropdown is a separate client component.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Package className="h-5 w-5 text-primary" />
          <span>{APP_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/browse" className="text-muted-foreground hover:text-foreground">
            Browse
          </Link>
          <Link href="/browse?segment=pro" className="text-muted-foreground hover:text-foreground">
            Pro gear
          </Link>
          <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/listings/new">List an item</Link>
              </Button>
              <UserMenu
                email={user.email ?? ""}
                fullName={profile?.full_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
