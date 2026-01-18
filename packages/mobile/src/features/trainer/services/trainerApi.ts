import { api } from '../../../shared/api/client';

export type TrainerClientSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
  complianceScore: number;
  unreviewedSurveys: number;
  lastMeasurementDays: number | null;
  lastMeasurementDate: string | null;
  archived: boolean;
};

export type TrainerSurvey = {
  id: string;
  date: string;
  sleep: string;
  stress: string;
  motivation: string;
  status: 'reviewed' | 'pending';
  details: Record<string, string>;
};

export type TrainerMeasurement = {
  id: string;
  date: string;
  metrics: {
    arms: number;
    legs: number;
    waist: number;
    chest: number;
    hips: number;
  };
  hasPhotos: boolean;
  photos: string[];
};

export type TrainerClientDetail = {
  id: string;
  name: string;
  avatarUrl: string | null;
  archived: boolean;
  goals: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  } | null;
  complianceHistory: { day: string; value: number }[];
  surveys: TrainerSurvey[];
  measurements: TrainerMeasurement[];
};

export type TrainerInvite = {
  id: string;
  code: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  clientId: string | null;
};

export const trainerApi = {
  async getClients(): Promise<TrainerClientSummary[]> {
    const response = await api.get('/trainer/clients');
    return response.data.clients;
  },

  async getClientDetail(clientId: string): Promise<TrainerClientDetail> {
    const response = await api.get(`/trainer/clients/${clientId}`);
    return response.data;
  },

  async updateGoals(clientId: string, data: { protein: number; fat: number; carbs: number; fiber: number | null }) {
    const response = await api.put(`/trainer/clients/${clientId}/goals`, {
      dailyProtein: data.protein,
      dailyFat: data.fat,
      dailyCarbs: data.carbs,
      dailyFiber: data.fiber,
    });
    return response.data;
  },

  async getInvites(): Promise<TrainerInvite[]> {
    const response = await api.get('/trainer/invites');
    return response.data.invites;
  },

  async archiveClient(clientId: string) {
    const response = await api.post(`/trainer/clients/${clientId}/archive`);
    return response.data;
  },

  async unarchiveClient(clientId: string) {
    const response = await api.post(`/trainer/clients/${clientId}/unarchive`);
    return response.data;
  },
};
