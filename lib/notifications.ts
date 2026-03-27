import * as Notifications from 'expo-notifications';
import { databases, config } from './appwrite';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export async function registrarPushToken(userId: string) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Atualizar o token no Appwrite document do usuário
    await databases.updateDocument(
      config.databaseId,
      config.collections.usuarios,
      userId,
      { expo_push_token: token }
    );
  } catch (e) {
    console.error('Falha ao registrar push token no Appwrite', e);
  }
}
