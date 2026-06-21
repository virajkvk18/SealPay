import CreateDealForm from "@/components/CreateDealForm";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";

export default async function CreateDealPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialDealKind = type === "public" ? "public" : "direct";

  return (
    <RoleGuard allow={["client"]}>
      <main className="page-shell grid-bg">
        <Navbar />
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-[#6d28d9]">
              Smart Contract Escrow
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-normal text-[#1e1233] sm:text-5xl">
              Create a Deal
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#43474b]">
              Choose a direct wallet assignment or publish an opportunity for
              freelancer applications.
            </p>
          </div>

          <CreateDealForm initialDealKind={initialDealKind} />
        </section>
      </main>
    </RoleGuard>
  );
}
