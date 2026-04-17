const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const achievements = [
    {
      key: 'first_booking',
      name: 'First Steps',
      description: 'Book a room in any library for the first time.',
      icon: '⭐',
    },
    {
      key: 'moffitt_regular',
      name: 'Moffitt Regular',
      description: 'Visit Moffitt Library 10 times.',
      icon: '📚',
    },
    {
      key: 'library_hopper',
      name: 'Library Hopper',
      description: 'Visit 5 different libraries.',
      icon: '🏃',
    },
    {
      key: 'night_owl',
      name: 'Night Owl',
      description: 'Check in after midnight.',
      icon: '🦉',
    },
    {
      key: 'early_bird',
      name: 'Early Bird',
      description: 'Check in before 8am.',
      icon: '🐦',
    },
    {
      key: 'first_rating',
      name: 'Critic',
      description: 'Submit your first library rating.',
      icon: '⭐',
    },
    {
      key: 'ten_ratings',
      name: 'Super Critic',
      description: 'Submit 10 library ratings.',
      icon: '🌟',
    },
    {
      key: 'all_libraries',
      name: 'Berkeley Scholar',
      description: 'Visit every library on campus.',
      icon: '🎓',
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: achievement,
    });
  }

  console.log(`Seeded ${achievements.length} achievements.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
