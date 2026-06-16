import CreateDealForm from "@/components/CreateDealForm";
import Navbar from "@/components/Navbar";

export default function CreateDealPage() {
  return (
    <main className="page-shell">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CreateDealForm />
      </section>
    </main>
  );
}
