import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-2 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. MVP skeleton — not for production use.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/browse" className="hover:text-foreground">Browse</Link>
          <Link href="/listings/new" className="hover:text-foreground">List an item</Link>
          <Link href="/onboarding" className="hover:text-foreground">Become a lender</Link>
        </nav>
      </div>
    </footer>
  );
}
