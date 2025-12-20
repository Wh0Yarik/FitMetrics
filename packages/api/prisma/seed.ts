import { PrismaClient, UserRole, UserStatus, TrainerStatus, InviteStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.user.deleteMany()
  console.log('Cleared existing data')

  // 1. Create test admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fitmetrics.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  })
  console.log(`Admin created: ${admin.email}`)

  // 2. Create test trainer
  const trainerPassword = await bcrypt.hash('trainer123', 10)
  const trainerUser = await prisma.user.create({
    data: {
      email: 'trainer@fitmetrics.com',
      passwordHash: trainerPassword,
      role: UserRole.TRAINER,
      status: UserStatus.ACTIVE,
      trainer: {
        create: {
          name: 'John Trainer',
          specialization: 'Nutrition & Fitness',
          bio: 'Professional trainer with 10+ years experience',
          moderationStatus: TrainerStatus.APPROVED,
          telegramChatId: '123456789',
        },
      },
    },
    include: { trainer: true },
  })
  console.log(`Trainer created: ${trainerUser.email}`)

  // 3. Create test client
  const clientPassword = await bcrypt.hash('client123', 10)
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@fitmetrics.com',
      passwordHash: clientPassword,
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      client: {
        create: {
          name: 'Jane Doe',
          gender: 'F',
          age: 28,
          height: 165,
          currentTrainerId: trainerUser.trainer?.id,
        },
      },
    },
    include: { client: true },
  })
  console.log(`Client created: ${clientUser.email}`)

  // 4. Create nutrition goals for client
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const goal = await prisma.nutritionGoal.create({
    data: {
      clientId: clientUser.client!.id,
      trainerId: trainerUser.trainer!.id,
      dailyProtein: 150,
      dailyFat: 60,
      dailyCarbs: 200,
      dailyFiber: 30,
      startDate: today,
    },
  })
  console.log('Nutrition goals created')

  // 5. Create invite codes
  const inviteCode = await prisma.inviteCode.create({
    data: {
      code: 'TEST123456',
      trainerId: trainerUser.trainer!.id,
      status: InviteStatus.USED,
      clientId: clientUser.client!.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usedAt: new Date(),
    },
  })
  console.log(`Invite code created: ${inviteCode.code}`)

  // 6. Create diary entry
  const diaryEntry = await prisma.diaryEntry.create({
    data: {
      clientId: clientUser.client!.id,
      date: today,
      totalProtein: 145,
      totalFat: 58,
      totalCarbs: 195,
      totalFiber: 28,
      synced: true,
      mealEntries: {
        create: [
          {
            time: '08:00',
            protein: 40,
            fat: 15,
            carbs: 50,
            fiber: 8,
            comment: 'Breakfast',
          },
          {
            time: '13:00',
            protein: 50,
            fat: 20,
            carbs: 70,
            fiber: 10,
            comment: 'Lunch',
          },
          {
            time: '18:00',
            protein: 55,
            fat: 23,
            carbs: 75,
            fiber: 10,
            comment: 'Dinner',
          },
        ],
      },
    },
  })
  console.log('Diary entry created')

  // 7. Create daily survey
  const survey = await prisma.dailySurvey.create({
    data: {
      clientId: clientUser.client!.id,
      date: today,
      motivation: 8,
      sleepHours: 8,
      sleepQuality: 4,
      stress: 4,
      digestion: 'good',
      water: 2.5,
      hunger: 5,
      libido: 7,
      weight: 65.5,
      comment: 'Feeling good',
      viewedByTrainer: true,
      viewedAt: new Date(),
      synced: true,
    },
  })
  console.log('Daily survey created')

  console.log('Seeding completed!')
  console.log('')
  console.log('Test Credentials:')
  console.log('Admin:  admin@fitmetrics.com / admin123')
  console.log('Trainer: trainer@fitmetrics.com / trainer123')
  console.log('Client: client@fitmetrics.com / client123')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })