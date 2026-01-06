import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { api } from '../../../shared/api/client';

type TrainerContact = { label: string; value: string };
type TrainerPayload = {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  avatarUrl?: string | null;
  contacts?: TrainerContact[];
};

export const useTrainerConnection = () => {
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState('');
  const [trainerStatus, setTrainerStatus] = useState('');
  const [trainerAvatar, setTrainerAvatar] = useState<string | null>(null);
  const [trainerContacts, setTrainerContacts] = useState<TrainerContact[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [isInviteOpen, setInviteOpen] = useState(false);

  const trainerDisplayName = useMemo(() => trainerName || 'Тренер не назначен', [trainerName]);
  const trainerDisplayStatus = useMemo(() => trainerStatus || 'Нет связи', [trainerStatus]);

  const applyTrainerData = useCallback((trainer: TrainerPayload | null) => {
    if (trainer) {
      setTrainerId(trainer.id ?? null);
      setTrainerName(trainer.name ?? '');
      setTrainerStatus(trainer.status || 'На связи');
      setTrainerAvatar(trainer.avatarUrl ?? null);

      const contacts = Array.isArray(trainer.contacts) ? [...trainer.contacts] : [];
      setTrainerContacts(contacts);
    } else {
      setTrainerId(null);
      setTrainerName('');
      setTrainerStatus('');
      setTrainerAvatar(null);
      setTrainerContacts([]);
    }
  }, []);

  const handleSaveInvite = useCallback(() => {
    if (!inviteCode.trim()) {
      Alert.alert('Инвайт-код', 'Введите код тренера');
      return;
    }

    Alert.alert(
      'Сменить тренера',
      'Вы отвяжетесь от текущего тренера и привяжетесь к новому. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сменить',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/users/me/trainer', { inviteCode: inviteCode.trim() });
              const data = response.data;
              applyTrainerData(data.trainer ?? null);
              setInviteOpen(false);
              setInviteCode('');
              Alert.alert('Готово', 'Тренер успешно изменен');
            } catch (error: any) {
              const message = error.response?.data?.message || 'Не удалось сменить тренера';
              Alert.alert('Ошибка', message);
            }
          },
        },
      ]
    );
  }, [applyTrainerData, inviteCode]);

  const removeTrainer = useCallback(async () => {
    try {
      const response = await api.delete('/users/me/trainer');
      const data = response.data;
      applyTrainerData(data.trainer ?? null);
      Alert.alert('Готово', 'Тренер удален');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось удалить тренера';
      Alert.alert('Ошибка', message);
    }
  }, [applyTrainerData]);

  return {
    trainerId,
    trainerName,
    trainerStatus,
    trainerAvatar,
    trainerContacts,
    inviteCode,
    isInviteOpen,
    trainerDisplayName,
    trainerDisplayStatus,
    setInviteCode,
    setInviteOpen,
    applyTrainerData,
    handleSaveInvite,
    removeTrainer,
  };
};
