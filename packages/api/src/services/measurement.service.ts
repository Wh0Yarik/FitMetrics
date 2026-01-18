import prisma from '../lib/db';
import { AppError } from '../lib/AppError';
import type { MeasurementEntryInput } from '../schemas/measurement.schema';

const toDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date format', 400);
  }
  return parsed;
};

const normalizePair = (left?: number | null, right?: number | null) => {
  const leftValue = typeof left === 'number' ? left : null;
  const rightValue = typeof right === 'number' ? right : null;
  if (leftValue == null && rightValue == null) return null;
  if (leftValue == null) return rightValue;
  if (rightValue == null) return leftValue;
  return (leftValue + rightValue) / 2;
};

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

  async syncForClient(userId: string, data: MeasurementEntryInput) {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const date = toDate(data.date);
    const arms = normalizePair(data.leftArm, data.rightArm);
    const legs = normalizePair(data.leftLeg, data.rightLeg);

    const measurement = await prisma.measurement.upsert({
      where: {
        clientId_weekStartDate: {
          clientId: client.id,
          weekStartDate: date,
        },
      },
      update: {
        armCircumference: arms,
        legCircumference: legs,
        waistCircumference: data.waist ?? null,
        chestCircumference: data.chest ?? null,
        hipCircumference: data.hips ?? null,
        synced: true,
      },
      create: {
        clientId: client.id,
        weekStartDate: date,
        armCircumference: arms,
        legCircumference: legs,
        waistCircumference: data.waist ?? null,
        chestCircumference: data.chest ?? null,
        hipCircumference: data.hips ?? null,
        synced: true,
      },
    });

    return { id: measurement.id, synced: true };
  }
}
