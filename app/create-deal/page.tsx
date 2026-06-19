import CreateDealForm from "@/components/CreateDealForm";
import Navbar from "@/components/Navbar";

export default function CreateDealPage() {
  return (
    <main className="page-shell grid-bg">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-[#00566a]">
            Invoice Escrow
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-normal text-[#010b13] sm:text-5xl">
            Create New Invoice
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
            Deploy an immutable payment request secured by the SealPay escrow
            vault.
          </p>
        </div>

        <CreateDealForm />
      </section>
    </main>
  );
}
