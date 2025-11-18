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
          lastLoginAt: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      auditLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          action: true,
          createdAt: true,
          details: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          reports: true,
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

