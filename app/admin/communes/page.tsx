import { prisma } from "@/lib/prisma";
import { AdminCommunesManager } from "@/components/AdminCommunesManager";

export default async function AdminCommunesPage() {
  const communes = await prisma.commune.findMany({
    include: {
      users: {
        where: { role: "TOWN_MANAGER" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AdminCommunesManager communes={communes} />
  );
}

