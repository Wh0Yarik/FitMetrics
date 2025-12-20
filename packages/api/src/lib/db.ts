import { PrismaClient } from '@prisma/client';
// Singleton pattern для Prisma
let prisma: PrismaClient; 
if (process.env.NODE_ENV === 'production') {
prisma = new PrismaClient()
} else {
// В разработке переиспользуем инстанс для hot reload
if (!(global as any).prisma) {
(global as any).prisma = new PrismaClient({
log: [
{ emit: 'stdout', level: 'query' },
{ emit: 'stdout', level: 'info' },
{ emit: 'stdout', level: 'warn' },
{ emit: 'stdout', level: 'error' },
],
})
}
prisma = (global as any).prisma
}
// Graceful shutdown
process.on('SIGINT', async () => {
console.log('🔌 Disconnecting Prisma...')
await prisma.$disconnect()
process.exit(0)
})
