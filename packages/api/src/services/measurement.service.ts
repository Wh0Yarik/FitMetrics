import prisma from '../lib/db';
import { AppError } from '../lib/AppError';

export class MeasurementService {
  async listForClient(userId: string) {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const measurements = await prisma.measurement.findMany({
      where: { clientId: client.id },
      orderBy: { weekStartDate: 'desc' },
    });

    return measurements.map((measurement) => ({
      id: measurement.id,
      date: measurement.weekStartDate.toISOString(),
      arms: measurement.armCircumference ?? null,
      legs: measurement.legCircumference ?? null,
      waist: measurement.waistCircumference ?? null,
      chest: measurement.chestCircumference ?? null,
      hips: measurement.hipCircumference ?? null,
    }));
  }
}
