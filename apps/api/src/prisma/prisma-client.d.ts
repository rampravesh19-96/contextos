// Prisma Client is generated into node_modules by `pnpm db:generate`.
// This narrow declaration keeps the API source type-checkable before that
// generated artifact is present (for example in an offline editor session).
declare module '@prisma/client' {
  export class PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $on(event: 'beforeExit', listener: () => Promise<void>): void;
    user: {
      findUnique(args: {
        where: { email: string };
      }): Promise<{ id: string; email: string; name: string | null; passwordHash: string } | null>;
    };
    session: {
      create(args: {
        data: { tokenHash: string; userId: string; expiresAt: Date };
      }): Promise<unknown>;
      findFirst(args: {
        where: { tokenHash: string; expiresAt: { gt: Date } };
        include: { user: true };
      }): Promise<{ user: { id: string; email: string; name: string | null } } | null>;
      deleteMany(args: { where: { tokenHash: string } }): Promise<unknown>;
    };
    workspaceMember: { findUnique(args: unknown): Promise<{ role: string } | null> };
    workspace: {
      findMany(
        args: unknown,
      ): Promise<
        Array<{ id: string; name: string; slug: string; members: Array<{ role: string }> }>
      >;
      findUnique(args: unknown): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
      } | null>;
    };
    knowledgeBase: {
      findMany(args: unknown): Promise<unknown[]>;
      create(args: unknown): Promise<unknown>;
      update(args: unknown): Promise<unknown>;
      delete(args: unknown): Promise<unknown>;
      deleteMany(args: unknown): Promise<{ count: number }>;
      findUnique(args: unknown): Promise<unknown | null>;
    };
  }
}
