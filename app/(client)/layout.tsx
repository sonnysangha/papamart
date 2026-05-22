import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import CartSync from "@/components/client/CartSync";
import Header from "@/components/client/Header";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, getToken } = await auth();
  if (userId) {
    try {
      const token = await getToken({ template: "convex" });
      if (token) {
        await fetchMutation(api.users.ensureCurrent, {}, { token });
      }
    } catch (err) {
      // Backstop only — the Clerk webhook is the canonical source of truth.
      // Swallow so a missing JWT template or transient failure doesn't break rendering.
      console.error("ensureCurrent backstop failed", err);
    }
  }

  return (
    <>
      <CartSync />
      <Header />
      <main className="flex-1">{children}</main>
    </>
  );
}
