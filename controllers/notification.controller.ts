import { Request, Response } from 'express';
import admin from 'firebase-admin';
import { db } from '../firebase-admin';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() { }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Save user FCM token into Firestore
  public async saveUserToken(req: Request, res: Response): Promise<any | void> {
    try {
      const { token, userId } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'FCM token is required' });
      }

      await db.collection('UserTokens').doc(userId || `anon_${Date.now()}`).set({
        fcmToken: token,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      }, { merge: true });

      res.status(200).json({
        success: true,
        message: 'Token saved successfully'
      });
    } catch (error) {
      console.error('🔥 Error saving FCM token:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Send notification to all active tokens
  public async sendNotificationToAll(title: string, body: string, data?: any) {
    try {
      const tokensSnapshot = await db.collection('UserTokens')
        .where('isActive', '==', true)
        .get();

      const tokens = tokensSnapshot.docs.map(doc => doc.data().fcmToken);
      console.log(`📨 Found ${tokens.length} active FCM tokens:`, tokens);

      if (tokens.length === 0) {
        console.warn('⚠️ No FCM tokens found to send notifications.');
        return {
          successCount: 0,
          failureCount: 0,
        };
      }

      // Prepare the multicast message
      const multicastMessage: admin.messaging.MulticastMessage = {
  tokens,
  data: {
    title,
    body,
    icon: '/icon.png',
    click_action: data?.click_action || 'https://nkym.vercel.app/#events',
    ...data // merge any additional data
  }
};


      // Send notifications
      const response = await admin.messaging().sendEachForMulticast(multicastMessage);
      console.log(`✅ Notification sent: ${response.successCount} success, ${response.failureCount} failure`);

      // Cleanup any invalid tokens
      await this.cleanupInvalidTokens(response, tokens);

      // Log to Firestore
      await db.collection('NotificationLogs').add({
        title,
        body,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        tokensSent: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response;
    } catch (error) {
      console.error('🚨 Failed to send notifications:', error);
      throw error;
    }
  }

  // Remove invalid or unregistered tokens from Firestore
  private async cleanupInvalidTokens(
    response: admin.messaging.BatchResponse,
    tokens: string[]
  ): Promise<void> {
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length === 0) {
      console.log('✅ No invalid tokens to clean up.');
      return;
    }

    const snapshot = await db
      .collection('UserTokens')
      .where('fcmToken', 'in', invalidTokens)
      .get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
    console.log(`🧹 Cleaned up ${invalidTokens.length} invalid tokens`);
  }
}

// Controller: Save token API handler
export const saveUserToken = (req: Request, res: Response) => {
  return NotificationService.getInstance().saveUserToken(req, res);
};

// Controller: Send custom notification API handler
export const sendCustomNotification = async (req: Request, res: Response): Promise<any | void> => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const notificationService = NotificationService.getInstance();
    const response = await notificationService.sendNotificationToAll(title, body, data);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      details: {
        successCount: response.successCount || 0,
        failureCount: response.failureCount || 0,
      },
    });
  } catch (error) {
    console.error('🚨 Error in sendCustomNotification:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// Controller: Called internally after event creation
export const sendEventNotification = async (eventData: any) => {
  const notificationService = NotificationService.getInstance();
  return await notificationService.sendNotificationToAll(
    '🎉 New Ganesh Utsav Event!',
    `${eventData?.title} - ${eventData?.date}`,
    {
      eventId: eventData?.id || '',
      type: 'event',
      action: 'view_event',
    }
  );
};

export const getNotificationLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    const snapshot = await db
      .collection('NotificationLogs')
      .orderBy('sentAt', 'desc')
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('🚨 Error fetching notification logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
};
