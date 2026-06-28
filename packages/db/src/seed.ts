import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed challenges
  const challenges = [
    { title: '7-Day Hydration Challenge', description: 'Drink 2L of water every day for 7 days', pillar: 'HEALTH' as const, emoji: '💧', startDate: new Date(), endDate: new Date(Date.now() + 7 * 86400000), rewardXp: 150 },
    { title: '30-Day Meditation Challenge', description: 'Meditate for at least 10 minutes daily', pillar: 'HEALTH' as const, emoji: '🧘', startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000), rewardXp: 500 },
    { title: 'Gratitude Week', description: 'Log 3 gratitudes every day for a week', pillar: 'HEART' as const, emoji: '🙏', startDate: new Date(), endDate: new Date(Date.now() + 7 * 86400000), rewardXp: 200 },
    { title: 'Goal Sprint', description: 'Complete one milestone from any goal', pillar: 'HOPE' as const, emoji: '🚀', startDate: new Date(), endDate: new Date(Date.now() + 14 * 86400000), rewardXp: 300 },
    { title: 'Help Someone Daily', description: 'Perform one act of kindness each day for 5 days', pillar: 'HELP' as const, emoji: '🤝', startDate: new Date(), endDate: new Date(Date.now() + 5 * 86400000), rewardXp: 250 },
  ];

  for (const c of challenges) {
    await prisma.challenge.upsert({
      where: { id: c.title }, // use title as pseudo-unique for seeding
      create: c,
      update: {},
    }).catch(() => prisma.challenge.create({ data: c }));
  }

  // Seed community
  await prisma.community.upsert({
    where: { slug: 'general' },
    create: { name: 'SthirMind Community', slug: 'general', description: 'The main community for all SthirMind members', memberCount: 12400 },
    update: {},
  });

  console.log('✅ Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
