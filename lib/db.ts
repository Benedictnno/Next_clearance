import { PrismaClient } from "@prisma/client/edge";

declare global {
  // Using `var` here is intentional for global re-use in dev
  // (Next.js hot-reloading can recreate modules multiple times)
  // eslint-disable-next-line no-var
  var prismaGlobal: InstanceType<typeof PrismaClient> | undefined;
}

const prisma = globalThis.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
