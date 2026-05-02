const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const achievements = [
    {
      key: 'first_booking',
      name: 'First Steps',
      description: 'Book a room in any library for the first time.',
      icon: null,
    },
    {
      key: 'library_hopper',
      name: 'Library Hopper',
      description: 'Visit 5 different libraries.',
      icon: null,
    },
    {
      key: 'night_owl',
      name: 'Night Owl',
      description: 'Check in after midnight.',
      icon: null,
    },
    {
      key: 'early_bird',
      name: 'Early Bird',
      description: 'Check in before 8am.',
      icon: null,
    },
    {
      key: 'first_rating',
      name: 'Critic',
      description: 'Submit your first library rating.',
      icon: null,
    },
    {
      key: 'ten_ratings',
      name: 'Super Critic',
      description: 'Submit 10 library ratings.',
      icon: null,
    },
    {
      key: 'all_libraries',
      name: 'Berkeley Scholar',
      description: 'Visit every library on campus.',
      icon: null,
    },
  ];

  const libraries = [
    { libraryName: 'Art History/Classics Library',                          keyPrefix: 'art_history',       label: 'Art History/Classics Library' },
    { libraryName: 'Bancroft Library',                                      keyPrefix: 'bancroft',          label: 'Bancroft Library' },
    { libraryName: 'Berkeley Art Museum and Pacific Film Archive',          keyPrefix: 'bampfa',            label: 'Berkeley Art Museum and Pacific Film Archive' },
    { libraryName: 'Berkeley Law Library',                                  keyPrefix: 'law',               label: 'Berkeley Law Library' },
    { libraryName: 'Bioscience, Natural Resources & Public Health Library', keyPrefix: 'bioscience',        label: 'Bioscience, Natural Resources & Public Health Library' },
    { libraryName: 'Business Library',                                      keyPrefix: 'business',          label: 'Business Library' },
    { libraryName: 'Chemistry, Astronomy & Physics Library',                keyPrefix: 'chemistry',         label: 'Chemistry, Astronomy & Physics Library' },
    { libraryName: 'Doe Library',                                           keyPrefix: 'doe',               label: 'Doe Library' },
    { libraryName: 'Earth Sciences & Map Library',                          keyPrefix: 'earth_sciences',    label: 'Earth Sciences & Map Library' },
    { libraryName: 'East Asian Library',                                    keyPrefix: 'east_asian',        label: 'East Asian Library' },
    { libraryName: 'Engineering & Mathematical Sciences Library',           keyPrefix: 'engineering',       label: 'Engineering & Mathematical Sciences Library' },
    { libraryName: 'Environmental Design Library',                          keyPrefix: 'environmental',     label: 'Environmental Design Library' },
    { libraryName: 'Ethnic Studies Library',                                keyPrefix: 'ethnic_studies',    label: 'Ethnic Studies Library' },
    { libraryName: 'Graduate Services (study only)',                        keyPrefix: 'graduate_services', label: 'Graduate Services' },
    { libraryName: 'Institute of Governmental Studies Library',             keyPrefix: 'igs',               label: 'Institute of Governmental Studies Library' },
    { libraryName: 'Institute of Transportation Studies Library',           keyPrefix: 'its',               label: 'Institute of Transportation Studies Library' },
    { libraryName: 'Main (Gardner) Stacks',                                 keyPrefix: 'main_stacks',       label: 'Main (Gardner) Stacks' },
    { libraryName: 'Moffitt Library (temporarily closed)',                  keyPrefix: 'moffitt',           label: 'Moffitt Library' },
    { libraryName: 'Morrison Library',                                      keyPrefix: 'morrison',          label: 'Morrison Library' },
    { libraryName: 'Music Library',                                         keyPrefix: 'music',             label: 'Music Library' },
    { libraryName: 'Newspapers & Microforms Library',                       keyPrefix: 'newspapers',        label: 'Newspapers & Microforms Library' },
    { libraryName: 'Social Research Library',                               keyPrefix: 'social_research',   label: 'Social Research Library' },
    { libraryName: 'South/Southeast Asia Library (study only)',             keyPrefix: 'south_asia',        label: 'South/Southeast Asia Library' },
    { libraryName: 'Systemwide Library Facility-North',                     keyPrefix: 'slf_north',         label: 'Systemwide Library Facility-North' },
  ];

  const tiers = [
    { count: 5,   suffix: '_5',   label: 'Regular' },
    { count: 10,  suffix: '_10',  label: 'Veteran' },
    { count: 25,  suffix: '_25',  label: 'Devotee' },
    { count: 50,  suffix: '_50',  label: 'Expert' },
    { count: 100, suffix: '_100', label: 'Master' },
  ];

  const libraryAchievements = libraries.flatMap(({ keyPrefix, label }) =>
    tiers.map(({ count, suffix, label: tierLabel }) => ({
      key: `visit_${keyPrefix}${suffix}`,
      name: `${label} ${tierLabel}`,
      description: `Visit ${label} ${count} times.`,
      icon: null,
    }))
  );

  for (const achievement of [...achievements, ...libraryAchievements]) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: achievement,
    });
  }

  console.log(`Seeded ${achievements.length + libraryAchievements.length} achievements.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
