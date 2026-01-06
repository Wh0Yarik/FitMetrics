import { PrismaClient, UserRole, UserStatus, TrainerStatus, InviteStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.user.deleteMany()
  console.log('Cleared existing data')

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
          avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop',
          phone: '+1 555 010 2020',
          socialLink: 'https://t.me/fitmetrics_trainer',
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

  const clientPassword = await bcrypt.hash('client123', 10)
  const clientSeeds = [
    { email: 'client1@fitmetrics.com', name: 'Иван Петров', gender: 'M', birthDate: '1994-02-12', height: 178, baseWeight: 82 },
    { email: 'client2@fitmetrics.com', name: 'Мария Соколова', gender: 'F', birthDate: '1998-07-03', height: 165, baseWeight: 62 },
    { email: 'client3@fitmetrics.com', name: 'Артем К.', gender: 'M', birthDate: '1991-11-24', height: 182, baseWeight: 88 },
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 13)

  const days: Date[] = []
  for (let i = 0; i < 14; i += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push(date)
  }

  const splitMacro = (total: number) => {
    const first = Math.round(total * 0.3)
    const second = Math.round(total * 0.4)
    const third = total - first - second
    return [first, second, third]
  }

  const getMonday = (date: Date) => {
    const copy = new Date(date)
    const day = copy.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    copy.setDate(copy.getDate() + diff)
    copy.setHours(0, 0, 0, 0)
    return copy
  }

  const weekStartDates = [getMonday(today), getMonday(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))]

  for (const [index, clientSeed] of clientSeeds.entries()) {
    const safeName = clientSeed.name.replace(/\s+/g, '+');
    const clientUser = await prisma.user.create({
      data: {
        email: clientSeed.email,
        passwordHash: clientPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        client: {
          create: {
            name: clientSeed.name,
            gender: clientSeed.gender,
            birthDate: clientSeed.birthDate ? new Date(`${clientSeed.birthDate}T00:00:00.000Z`) : null,
            height: clientSeed.height,
            avatarUrl: `https://placehold.co/200x200?text=${safeName}`,
            telegram: `@${safeName.toLowerCase()}`,
            currentTrainerId: trainerUser.trainer?.id,
          },
        },
      },
      include: { client: true },
    })

    console.log(`Client created: ${clientUser.email}`)

    await prisma.nutritionGoal.create({
      data: {
        clientId: clientUser.client!.id,
        trainerId: trainerUser.trainer!.id,
        dailyProtein: 150 + index * 10,
        dailyFat: 60 + index * 5,
        dailyCarbs: 200 + index * 10,
        dailyFiber: 30,
        startDate: today,
      },
    })

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code: `CLIENT${index + 1}00${index + 5}`,
        trainerId: trainerUser.trainer!.id,
        status: InviteStatus.USED,
        clientId: clientUser.client!.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usedAt: new Date(),
      },
    })
    console.log(`Invite code created: ${inviteCode.code}`)

    for (let i = 0; i < days.length; i += 1) {
      const date = days[i]
      const proteinTotal = 135 + index * 12 + (i % 5) * 4
      const fatTotal = 52 + index * 4 + (i % 3) * 3
      const carbsTotal = 180 + index * 10 + (i % 4) * 6
      const fiberTotal = 26 + (i % 3) * 2

      const [proteinBreakfast, proteinLunch, proteinDinner] = splitMacro(proteinTotal)
      const [fatBreakfast, fatLunch, fatDinner] = splitMacro(fatTotal)
      const [carbsBreakfast, carbsLunch, carbsDinner] = splitMacro(carbsTotal)
      const [fiberBreakfast, fiberLunch, fiberDinner] = splitMacro(fiberTotal)

      await prisma.diaryEntry.create({
        data: {
          clientId: clientUser.client!.id,
          date,
          totalProtein: proteinTotal,
          totalFat: fatTotal,
          totalCarbs: carbsTotal,
          totalFiber: fiberTotal,
          synced: true,
          mealEntries: {
            create: [
              {
                time: new Date(new Date(date).setHours(8, 0)),
                protein: proteinBreakfast,
                fat: fatBreakfast,
                carbs: carbsBreakfast,
                fiber: fiberBreakfast,
                name: 'Завтрак',
                synced: true,
              },
              {
                time: new Date(new Date(date).setHours(13, 0)),
                protein: proteinLunch,
                fat: fatLunch,
                carbs: carbsLunch,
                fiber: fiberLunch,
                name: 'Обед',
                synced: true,
              },
              {
                time: new Date(new Date(date).setHours(19, 0)),
                protein: proteinDinner,
                fat: fatDinner,
                carbs: carbsDinner,
                fiber: fiberDinner,
                name: 'Ужин',
                synced: true,
              },
            ],
          },
        },
      })

      await prisma.dailySurvey.create({
        data: {
          clientId: clientUser.client!.id,
          date,
          motivation: 6 + ((i + index) % 4),
          sleepHours: 6.5 + ((i + index) % 3),
          sleepQuality: 3 + ((i + index) % 3),
          stress: 4 + ((i + index) % 4),
          digestion: ['good', 'excellent', 'good', 'bad'][(i + index) % 4],
          water: 1.8 + ((i + index) % 4) * 0.3,
          hunger: 4 + ((i + index) % 4),
          libido: 5 + ((i + index) % 4),
          weight: clientSeed.baseWeight + i * 0.1,
          comment: 'Автозаполнение',
          viewedByTrainer: i % 3 === 0,
          viewedAt: i % 3 === 0 ? new Date() : null,
          synced: true,
        },
      })
    }

    for (let weekIndex = 0; weekIndex < weekStartDates.length; weekIndex += 1) {
      const weekStartDate = weekStartDates[weekIndex]
      const measurement = await prisma.measurement.create({
        data: {
          clientId: clientUser.client!.id,
          weekStartDate,
          armCircumference: 28 + index + weekIndex,
          legCircumference: 42 + index + weekIndex,
          waistCircumference: 75 + index + weekIndex,
          chestCircumference: 98 + index + weekIndex,
          hipCircumference: 92 + index + weekIndex,
          synced: true,
        },
      })

      await prisma.measurementPhoto.createMany({
        data: [
          {
            measurementId: measurement.id,
            type: 'FRONT',
            url: `https://placehold.co/300x400?text=Front+${safeName}`,
            synced: true,
          },
          {
            measurementId: measurement.id,
            type: 'SIDE',
            url: `https://placehold.co/300x400?text=Side+${safeName}`,
            synced: true,
          },
          {
            measurementId: measurement.id,
            type: 'BACK',
            url: `https://placehold.co/300x400?text=Back+${safeName}`,
            synced: true,
          },
        ],
      })
    }
  }

  const newInviteCode = await prisma.inviteCode.create({
    data: {
      code: 'START2025',
      trainerId: trainerUser.trainer!.id,
      status: InviteStatus.NEW,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`New invite code created: ${newInviteCode.code}`)

  console.log('Seeding completed!')
  console.log('')
  console.log('Test Credentials:')
  console.log('Admin:  admin@fitmetrics.com / admin123')
  console.log('Trainer: trainer@fitmetrics.com / trainer123')
  console.log('Clients:')
  console.log('client1@fitmetrics.com / client123')
  console.log('client2@fitmetrics.com / client123')
  console.log('client3@fitmetrics.com / client123')
  console.log('New Invite Code: START2025')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
