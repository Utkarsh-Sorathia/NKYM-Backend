import { Request, Response } from 'express';
import admin from 'firebase-admin';
import { db } from '../firebase-admin';

// Enhanced notification service with FCM
export class NotificationService {
  private static instance: NotificationService;

  private constructor() { }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Save FCM token from frontend
  async saveUserToken(req: Request, res: Response): Promise<any | void> {
    try {
      const { token, userId } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'FCM token is required' });
      }

      // Save to Firestore with your existing structure
      await db.collection('UserTokens').doc(userId || 'anonymous').set({
        fcmToken: token,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      }, { merge: true });

      res.status(200).json({
        success: true,
        message: 'Token saved successfully'
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Send notification to all active users
  async sendNotificationToAll(title: string, body: string, data?: any) {
    try {
      const tokensSnapshot = await db.collection('UserTokens')
        .where('isActive', '==', true)
        .get();

      const tokens = tokensSnapshot.docs.map(doc => doc.data().fcmToken);
      console.log(tokens);
      
      console.log(`Found ${tokens.length} active FCM tokens`);
      

      if (tokens.length === 0) {
        console.warn('⚠️ No FCM tokens to send notifications.');
        return;
      }

      // Now safe to use 'tokens' in batch message
      const message = {
        notification: {
          title,
          body,
          icon: '/favicon.ico'
        },
        tokens, // ✅ only used if not empty
        data: data || {}
      };

      const response = await admin.messaging().sendEachForMulticast(message);


      // Clean up invalid tokens
      await this.cleanupInvalidTokens(response, tokens);

      // Log notification for analytics
      await db.collection('NotificationLogs').add({
        title,
        body,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length
      });

      console.log(`Notification sent: ${response.successCount} success, ${response.failureCount} failure`);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Clean up invalid/expired tokens
  private async cleanupInvalidTokens(response: admin.messaging.BatchResponse, tokens: string[]) {
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Remove invalid tokens from database
    const batch = db.batch();
    const tokensSnapshot = await db.collection('UserTokens')
      .where('fcmToken', 'in', invalidTokens)
      .get();

    tokensSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });

    if (invalidTokens.length > 0) {
      await batch.commit();
      console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
    }
  }
}

// Controller methods
export const saveUserToken = (req: Request, res: Response) => {
  return NotificationService.getInstance().saveUserToken(req, res);
};

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
      message: `Notification sent successfully`,
      details: {
        successCount: response?.successCount || 0,
        failureCount: response?.failureCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Enhanced event notification (integrate with your existing events controller)
export const sendEventNotification = async (eventData: any) => {
  const notificationService = NotificationService.getInstance();
  return notificationService.sendNotificationToAll(
    'New Ganesh Utsav Event! 🎉',
    `${eventData.title} - ${eventData.date}`,
    {
      eventId: eventData.id,
      type: 'event',
      action: 'view_event'
    }
  );
};
