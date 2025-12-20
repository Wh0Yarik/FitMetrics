import prisma from '../lib/db';

async function main() {
  try {
    console.log('⏳ Проверка подключения к базе данных...');
    
    // Выполняем простой raw SQL запрос для проверки соединения
    const result = await prisma.$queryRaw`SELECT 1 as result, inet_server_port() as port, current_database() as db_name`;
    
    console.log('✅ Подключение к базе данных успешно установлено!');
    console.log('Результат тестового запроса:', result);
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();