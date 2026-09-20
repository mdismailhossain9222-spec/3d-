import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddressBook } from "@/components/account/address-book";

export default async function AddressesPage() {
  const u = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: u.id }, orderBy: [{ isDefault: "desc" }] });
  return <AddressBook initial={addresses} />;
}
