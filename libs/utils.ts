import { PrismaClient } from "../generated/prisma";


let prisma: PrismaClient

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}