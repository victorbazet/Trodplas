import Link from "next/link";
import { ArrowRight, Search, CalendarCheck, ShieldCheck, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIES, SEGMENTS, APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Louez ce qui prend trop de place
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Rent gear from people near you.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {APP_NAME} is the marketplace for renting objects — from drills and tents to
          pro cameras, lenses and instruments. Earn from what you own; borrow what you need.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/browse">
              Browse listings <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/listings/new">List your gear</Link>
          </Button>
        </div>
      </section>

      {/* Segments */}
      <section className="container grid gap-4 pb-12 md:grid-cols-2">
        {SEGMENTS.map((s) => (
          <Card key={s.value}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">{s.label}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
              <Button asChild variant="ghost">
                <Link href={`/browse?segment=${s.value}`}>
                  Explore <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Categories */}
      <section className="container pb-16">
        <h2 className="mb-4 text-xl font-semibold">Browse by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/browse?category=${c.value}`}
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t bg-muted/30">
        <div className="container py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">How it works</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: Search, title: "Find it", text: "Search nearby listings by category, dates and price." },
              { icon: CalendarCheck, title: "Request", text: "Pick your dates and send a booking request to the owner." },
              { icon: ShieldCheck, title: "Pay securely", text: "Pay the rental; a refundable deposit is held, not charged." },
              { icon: Banknote, title: "Owners earn", text: "Lenders are paid out automatically via Stripe, minus our fee." },
            ].map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
