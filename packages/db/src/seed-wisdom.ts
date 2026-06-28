import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WISDOM_BOOKS = [
  // Entrepreneurship
  { title: 'Zero to One', author: 'Peter Thiel', emoji: '🚀', pillar: 'startup', tags: ['entrepreneurship', 'startup', 'innovation', 'venture'], description: 'Notes on Startups, or How to Build the Future — Peter Thiel\'s contrarian philosophy on building companies that create entirely new things.' },
  { title: 'The Lean Startup', author: 'Eric Ries', emoji: '⚡', pillar: 'startup', tags: ['startup', 'entrepreneurship', 'agile', 'mvp'], description: 'How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses.' },
  { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', emoji: '🔨', pillar: 'startup', tags: ['startup', 'leadership', 'management', 'founder'], description: 'Building a Business When There Are No Easy Answers — raw, unfiltered lessons from Silicon Valley.' },
  { title: 'Shoe Dog', author: 'Phil Knight', emoji: '👟', pillar: 'startup', tags: ['entrepreneurship', 'memoir', 'nike', 'perseverance'], description: 'A Memoir by the Creator of Nike — an intensely personal memoir about building one of the world\'s most iconic brands.' },
  { title: 'Built to Last', author: 'Jim Collins', emoji: '🏛️', pillar: 'startup', tags: ['business', 'strategy', 'vision', 'leadership'], description: 'Successful Habits of Visionary Companies — the definitive study of what makes great companies endure.' },
  { title: 'The Art of Profitability', author: 'Adrian Slywotzky', emoji: '💰', pillar: 'finance', tags: ['business', 'profit', 'strategy', 'models'], description: 'A masterclass in 23 different profit models through the lens of a mentor-student dialogue.' },
  { title: 'Moneyball', author: 'Michael Lewis', emoji: '⚾', pillar: 'startup', tags: ['analytics', 'strategy', 'data', 'innovation'], description: 'The Art of Winning an Unfair Game — how data and analytics revolutionized baseball and business.' },
  { title: 'The More Mindset', author: 'Diana Pagano', emoji: '📈', pillar: 'mindset', tags: ['mindset', 'growth', 'abundance', 'business'], description: 'Where More Is Not Enough — reframing ambition and growth for sustainable success.' },
  { title: 'The Art of Spending Money', author: 'Morgan Housel', emoji: '💸', pillar: 'finance', tags: ['finance', 'money', 'psychology', 'wealth'], description: 'A behavioral guide to using money in a way that maximizes happiness and life satisfaction.' },
  { title: 'Shut Up and Listen!', author: 'Tilman Fertitta', emoji: '🤫', pillar: 'startup', tags: ['business', 'hospitality', 'leadership', 'no-excuses'], description: 'Hard Business Truths That Will Help You Succeed — unfiltered lessons from a self-made billionaire.' },
  { title: 'Buy Back Your Time', author: 'Dan Martell', emoji: '⏳', pillar: 'productivity', tags: ['time', 'delegation', 'entrepreneur', 'freedom'], description: 'Get Unstuck, Reclaim Your Freedom, and Build Your Empire — the playbook for buying back your time.' },

  // Leadership
  { title: 'Leaders Eat Last', author: 'Simon Sinek', emoji: '🛡️', pillar: 'leadership', tags: ['leadership', 'culture', 'trust', 'team'], description: 'Why Some Teams Pull Together and Others Don\'t — the biology and anthropology behind great leadership.' },
  { title: 'Good to Great', author: 'Jim Collins', emoji: '📈', pillar: 'leadership', tags: ['leadership', 'business', 'strategy', 'discipline'], description: 'Why Some Companies Make the Leap and Others Don\'t — research on what transforms good companies into great ones.' },
  { title: 'Radical Candor', author: 'Kim Scott', emoji: '💬', pillar: 'leadership', tags: ['leadership', 'feedback', 'management', 'communication'], description: 'Be a Kick-Ass Boss Without Losing Your Humanity — a framework for honest, caring leadership.' },
  { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', emoji: '🎯', pillar: 'mindset', tags: ['habits', 'effectiveness', 'character', 'principle'], description: 'Powerful Lessons in Personal Change — timeless principles that define character-based success.' },
  { title: 'Clear Thinking', author: 'Shane Parrish', emoji: '🧠', pillar: 'mindset', tags: ['thinking', 'decisions', 'clarity', 'mental-models'], description: 'Turning Ordinary Moments into Extraordinary Results through better decision-making.' },
  { title: '48 Laws of Power', author: 'Robert Greene', emoji: '👑', pillar: 'leadership', tags: ['power', 'strategy', 'history', 'influence'], description: 'A guide to the subtle, complex psychology of power through 3,000 years of history.' },
  { title: 'The Effective Executive', author: 'Peter Drucker', emoji: '📋', pillar: 'leadership', tags: ['management', 'effectiveness', 'productivity', 'executive'], description: 'The Definitive Guide to Getting the Right Things Done — Drucker\'s masterwork on executive effectiveness.' },
  { title: 'The Advantage', author: 'Patrick Lencioni', emoji: '🏆', pillar: 'leadership', tags: ['organization', 'culture', 'teamwork', 'leadership'], description: 'Why Organizational Health Trumps Everything Else in Business — the ultimate competitive advantage.' },
  { title: 'How Life Imitates Chess', author: 'Garry Kasparov', emoji: '♟️', pillar: 'mindset', tags: ['strategy', 'chess', 'thinking', 'planning'], description: 'Making the Right Moves, from the Board to the Boardroom — strategic thinking from the greatest chess player.' },

  // Social Impact
  { title: 'The Blue Economy', author: 'Gunter Pauli', emoji: '🌊', pillar: 'help', tags: ['sustainability', 'innovation', 'impact', 'environment'], description: '10 Years, 100 Innovations, 100 Million Jobs — a blueprint for a sustainable economy inspired by nature.' },
  { title: 'Let My People Go Surfing', author: 'Yvon Chouinard', emoji: '🏄', pillar: 'help', tags: ['sustainability', 'business', 'environment', 'culture'], description: 'The Education of a Reluctant Businessman — Patagonia\'s founder on business as a force for good.' },
  { title: 'How to Become a People Magnet', author: 'Marc Reklau', emoji: '🧲', pillar: 'relationships', tags: ['relationships', 'social', 'influence', 'charisma'], description: '62 Simple Strategies to Build Powerful Relationships and Positively Impact Everyone You Meet.' },
  { title: 'Think Again', author: 'Adam Grant', emoji: '🔁', pillar: 'mindset', tags: ['thinking', 'learning', 'humility', 'change'], description: 'The Power of Knowing What You Don\'t Know — how to question your own opinions and open other minds.' },
  { title: 'Supercommunicators', author: 'Charles Duhigg', emoji: '📡', pillar: 'relationships', tags: ['communication', 'conversation', 'connection', 'influence'], description: 'How to Unlock the Secret Language of Connection — the science behind meaningful conversations.' },
  { title: 'Making It All Work', author: 'David Allen', emoji: '✅', pillar: 'productivity', tags: ['productivity', 'gtd', 'organization', 'clarity'], description: 'Winning at the Game of Work and the Business of Life — GTD expanded to all life domains.' },
  { title: 'Start with Why', author: 'Simon Sinek', emoji: '❓', pillar: 'leadership', tags: ['purpose', 'leadership', 'why', 'inspiration'], description: 'How Great Leaders Inspire Everyone to Take Action — the Golden Circle framework for purpose-driven leadership.' },

  // Mindfulness
  { title: 'The Pathless Path', author: 'Paul Millerd', emoji: '🌿', pillar: 'spirituality', tags: ['purpose', 'work', 'freedom', 'alternative'], description: 'Imagining a New Story for Work and Life — breaking free from the default path to find meaningful work.' },
  { title: 'Build the Life You Want', author: 'Arthur Brooks & Oprah Winfrey', emoji: '🌅', pillar: 'mindset', tags: ['happiness', 'meaning', 'purpose', 'science'], description: 'The Art and Science of Getting Happier — a scientific approach to building lasting happiness.' },
  { title: 'Ikigai', author: 'Héctor García', emoji: '🌸', pillar: 'spirituality', tags: ['purpose', 'longevity', 'japanese', 'meaning'], description: 'The Japanese Secret to a Long and Happy Life — finding your reason for being at the intersection of passion and purpose.' },
  { title: 'The Art of Living', author: 'Thich Nhat Hanh', emoji: '🕊️', pillar: 'spirituality', tags: ['mindfulness', 'buddhism', 'presence', 'peace'], description: 'Peace and Freedom in the Here and Now — teachings on living fully in the present moment.' },
  { title: 'The Art of Happiness', author: 'Dalai Lama', emoji: '☀️', pillar: 'spirituality', tags: ['happiness', 'buddhism', 'compassion', 'wellbeing'], description: 'A Handbook for Living — conversations between the Dalai Lama and a psychiatrist on achieving lasting happiness.' },
  { title: 'The Power of Now', author: 'Eckhart Tolle', emoji: '🧘', pillar: 'spirituality', tags: ['mindfulness', 'presence', 'consciousness', 'spiritual'], description: 'A Guide to Spiritual Enlightenment — dissolving the ego and living in present-moment awareness.' },
  { title: 'Atomic Habits', author: 'James Clear', emoji: '⚛️', pillar: 'health', tags: ['habits', 'behavior', 'systems', 'change'], description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones — the definitive framework for habit formation.' },
  { title: 'Evolutionary Psychology', author: 'David Buss', emoji: '🧬', pillar: 'health', tags: ['psychology', 'evolution', 'behavior', 'science'], description: 'The New Science of the Mind — understanding human behavior through the lens of evolutionary psychology.' },
  { title: 'The Mountain Is You', author: 'Brianna Wiest', emoji: '⛰️', pillar: 'mindset', tags: ['self-sabotage', 'healing', 'growth', 'psychology'], description: 'Transforming Self-Sabotage Into Self-Mastery — why we get in our own way and how to stop.' },
  { title: 'Coming Alive', author: 'Phil Stutz & Barry Michels', emoji: '🔥', pillar: 'mindset', tags: ['psychology', 'therapy', 'tools', 'breakthrough'], description: '4 Tools to Defeat Your Inner Enemy, Ignite Creative Expression & Unleash Your Soul\'s Potential.' },
  { title: 'The Art of Laziness', author: 'Library Mindset', emoji: '🍃', pillar: 'productivity', tags: ['laziness', 'efficiency', 'simplicity', 'rest'], description: 'Overcome Procrastination & Improve Your Productivity — the counterintuitive power of strategic rest.' },
  { title: 'The Miracle of Mindfulness', author: 'Thich Nhat Hanh', emoji: '🪷', pillar: 'spirituality', tags: ['mindfulness', 'meditation', 'buddhism', 'awareness'], description: 'An Introduction to the Practice of Meditation — the foundational guide to mindfulness practice.' },
  { title: 'Reset', author: 'Dan Heath', emoji: '🔄', pillar: 'mindset', tags: ['change', 'reset', 'decisions', 'fresh-start'], description: 'How to Restart Your Life and Change the Game — practical strategies for meaningful life change.' },
  { title: 'Beyond Psychology', author: 'Otto Rank', emoji: '🌀', pillar: 'spirituality', tags: ['psychology', 'will', 'creativity', 'philosophy'], description: 'An Exploration of Human Development and the Will — foundational work on creativity, will, and the artist type.' },
  { title: 'Principles', author: 'Ray Dalio', emoji: '⚖️', pillar: 'mindset', tags: ['principles', 'decision-making', 'life', 'work'], description: 'Life and Work — Ray Dalio\'s life philosophy and radical transparency management principles.' },
  { title: 'The Winning Attitude', author: 'Jeff Keller', emoji: '🏅', pillar: 'mindset', tags: ['attitude', 'success', 'mindset', 'motivation'], description: 'Your Key to Personal Success — how your attitude determines the altitude of your life.' },
  { title: 'Win the Inside Game', author: 'Steve Magness', emoji: '🏆', pillar: 'mindset', tags: ['performance', 'mindset', 'inner-game', 'psychology'], description: 'How to Move from Surviving to Thriving — the psychology of high performance and inner mastery.' },
];

async function main() {
  console.log(`🌱 Seeding ${WISDOM_BOOKS.length} wisdom books...`);

  for (const book of WISDOM_BOOKS) {
    try {
      await (prisma as any).wisdomBook.upsert({
        where: { isbn: `seed-${book.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}` },
        create: {
          title: book.title,
          author: book.author,
          description: book.description,
          isbn: `seed-${book.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}`,
          tags: book.tags,
          pillar: book.pillar,
          isPublic: true,
          isVerified: true,
          language: 'en',
          totalPages: Math.floor(Math.random() * 200) + 150,
          publishedYear: 2010 + Math.floor(Math.random() * 14),
          avgRating: 4.0 + Math.random() * 0.9,
          totalRatings: Math.floor(Math.random() * 5000) + 500,
          totalReads: Math.floor(Math.random() * 10000) + 1000,
        },
        update: {
          description: book.description,
          tags: book.tags,
        },
      });
      console.log(`  ✓ ${book.emoji} ${book.title}`);
    } catch (e) {
      console.log(`  ✗ ${book.title}: ${(e as Error).message}`);
    }
  }

  console.log('\n✅ Wisdom books seeded successfully!');
  console.log('📖 Books will have AI summaries generated on first view.');
  console.log('🎧 Audio uses ElevenLabs as default provider.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
