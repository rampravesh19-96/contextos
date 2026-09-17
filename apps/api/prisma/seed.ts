import { PrismaClient, WorkspaceRole } from '@prisma/client';
import { hashPassword } from '../src/auth/session';

const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@contextos.dev' },
    update: {},
    create: {
      email: 'demo@contextos.dev',
      name: 'ContextOS Demo',
      passwordHash: hashPassword('DemoPass123!'),
    },
  });
  for (const [slug, name] of [
    ['demo-team', 'Demo Team'],
    ['product-lab', 'Product Lab'],
  ] as const) {
    const workspace = await prisma.workspace.upsert({
      where: { slug },
      update: {},
      create: { slug, name },
    });
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      update: { role: WorkspaceRole.OWNER },
      create: { workspaceId: workspace.id, userId: user.id, role: WorkspaceRole.OWNER },
    });
    await prisma.knowledgeBase.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: 'Getting started' } },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: 'Getting started',
        description: 'Clearly labelled deterministic demo knowledge base.',
      },
    });
  }
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
