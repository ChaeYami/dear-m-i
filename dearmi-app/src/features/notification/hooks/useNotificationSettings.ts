import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationApi, { type NotificationSettings } from '../api';

const SETTINGS_KEY = ['notificationSettings'];

export const useNotificationSettings = () => {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await notificationApi.getSettings();
      return data.data!;
    },
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      const { data } = await notificationApi.updateSettings(settings);
      return data.data!;
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_KEY });
      const prev = queryClient.getQueryData<NotificationSettings>(SETTINGS_KEY);
      queryClient.setQueryData(SETTINGS_KEY, newSettings);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(SETTINGS_KEY, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
};
