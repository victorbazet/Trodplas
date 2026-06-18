import { ListingForm } from "@/components/listing-form";

export const metadata = { title: "List an item" };

export default function NewListingPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">List an item</h1>
        <p className="text-muted-foreground">
          Share what takes up too much space and start earning.
        </p>
      </div>
      <ListingForm />
    </div>
  );
}
