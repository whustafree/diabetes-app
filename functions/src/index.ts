/**
 * Firebase Cloud Function para enviar notificaciones push programadas.
 *
 * ## Cómo desplegar:
 * 1. Instalar Firebase CLI: npm install -g firebase-tools
 * 2. Conectar: firebase login
 * 3. Ir al directorio: cd functions
 * 4. Compilar: npm run build
 * 5. Desplegar: firebase deploy --only functions
 *
 * ## Funcionamiento:
 * - `checkScheduledNotifications` se ejecuta cada minuto via cron (pubsub)
 * - Lee la subcolección users/{uid}/scheduledNotifications
 * - Filtra las notificaciones cuya hora actual coincida con la programada
 * - Envía FCM push a todos los tokens en users/{uid}/fcmTokens
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

interface ScheduledNotification {
  type: 'glucose' | 'medication' | 'meal' | 'exercise' | 'water' | 'custom';
  title: string;
  body?: string;
  time: string;       // HH:mm
  days: number[];     // 0=Dom, 1=Lun ... 6=Sáb
  timezone: string;   // Ej: "America/Mexico_City"
  enabled: boolean;
  sourceId?: string;
  lastFiredDate?: string; // YYYY-MM-DD — para evitar duplicados
}

/**
 * Cloud Function programada que se ejecuta cada minuto.
 * Usa PubSub para el scheduling.
 */
export const checkScheduledNotifications = functions.pubsub
  .schedule('* * * * *')
  .timeZone('America/Mexico_City')
  .onRun(async (context) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();
    const todayStr = now.toISOString().split('T')[0];

    functions.logger.info(`Checking scheduled notifications at ${currentTime} (day ${currentDay})`);

    try {
      // Obtener todos los usuarios
      const usersSnapshot = await db.collection('users').listDocuments();

      for (const userDoc of usersSnapshot) {
        const uid = userDoc.id;

        // Leer notificaciones programadas del usuario
        const notifsSnapshot = await db
          .collection('users')
          .doc(uid)
          .collection('scheduledNotifications')
          .where('enabled', '==', true)
          .get();

        if (notifsSnapshot.empty) continue;

        for (const doc of notifsSnapshot.docs) {
          const data = doc.data() as ScheduledNotification;

          // Verificar hora y día
          if (data.time !== currentTime) continue;
          if (!data.days.includes(currentDay)) continue;
          if (data.lastFiredDate === todayStr) continue; // Ya se disparó hoy

          // Obtener tokens FCM del usuario
          const tokensSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('fcmTokens')
            .get();

          const tokens: string[] = [];
          tokensSnapshot.forEach(t => tokens.push(t.data().token));

          if (tokens.length === 0) continue;

          // Enviar notificación push
          const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
              title: data.title,
              body: data.body || 'Recordatorio de Diabetes Control',
            },
            data: {
              type: data.type,
              sourceId: data.sourceId || '',
              scheduled: 'true',
            },
            webpush: {
              fcmOptions: {
                link: '/',
              },
            },
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          functions.logger.info(
            `Sent ${response.successCount} / ${tokens.length} notifications for user ${uid}`
          );

          // Marcar como disparada hoy
          await doc.ref.update({ lastFiredDate: todayStr });

          // Registrar envío en Firestore para trazabilidad
          await db
            .collection('users')
            .doc(uid)
            .collection('notificationLogs')
            .add({
              scheduledId: doc.id,
              title: data.title,
              type: data.type,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              successCount: response.successCount,
              failureCount: response.failureCount,
            });
        }
      }
    } catch (error) {
      functions.logger.error('Error checking scheduled notifications:', error);
    }
  });
