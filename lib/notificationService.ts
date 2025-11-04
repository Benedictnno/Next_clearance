import { collections } from './mongoCollections';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  types: {
    clearance: boolean;
    approval: boolean;
    rejection: boolean;
    completion: boolean;
    system: boolean;
  };
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const { notifications } = await collections();
      
      const notification = {
        userId,
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date(),
        metadata: metadata || {},
      };

      const result = await notifications.insertOne(notification);
      return String(result.insertedId);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      const { notifications } = await collections();
      
      const query: any = { userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      const notificationDocs = await notifications
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      return notificationDocs.map(doc => ({
        id: String(doc._id),
        userId: doc.userId,
        title: doc.title,
        message: doc.message,
        type: doc.type,
        isRead: doc.isRead,
        createdAt: doc.createdAt,
        metadata: doc.metadata,
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { notifications } = await collections();
      
      const result = await notifications.updateOne(
        { _id: new Object(notificationId), userId },
        { $set: { isRead: true } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const { notifications } = await collections();
      
      const result = await notifications.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { notifications } = await collections();
      
      const result = await notifications.deleteOne({
        _id: new Object(notificationId),
        userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { notifications } = await collections();
      
      const count = await notifications.countDocuments({
        userId,
        isRead: false
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Create clearance-related notifications
   */
  async notifyClearanceStepApproved(
    userId: string,
    stepName: string,
    stepNumber: number,
    isCompleted: boolean = false
  ): Promise<string> {
    const title = isCompleted ? 'Clearance Completed!' : 'Step Approved';
    const message = isCompleted 
      ? `Congratulations! Your clearance process is now complete. You can download your clearance certificate and NYSC form.`
      : `Your submission for step ${stepNumber}: ${stepName} has been approved. ${isCompleted ? 'Your clearance is now complete!' : 'You can now proceed to the next step.'}`;

    return await this.createNotification(
      userId,
      title,
      message,
      'success',
      { stepName, stepNumber, isCompleted, type: 'clearance_approval' }
    );
  }

  async notifyClearanceStepRejected(
    userId: string,
    stepName: string,
    stepNumber: number,
    comment?: string
  ): Promise<string> {
    const message = `Your submission for step ${stepNumber}: ${stepName} has been rejected. ${comment ? `Reason: ${comment}` : 'Please review and resubmit.'}`;

    return await this.createNotification(
      userId,
      'Step Rejected',
      message,
      'error',
      { stepName, stepNumber, comment, type: 'clearance_rejection' }
    );
  }

  async notifyClearanceCompleted(userId: string): Promise<string> {
    return await this.createNotification(
      userId,
      'Clearance Completed!',
      'Congratulations! Your clearance process is now complete. You can download your clearance certificate and NYSC form.',
      'success',
      { type: 'clearance_completion' }
    );
  }

  async notifyDocumentUploaded(
    userId: string,
    stepName: string,
    stepNumber: number
  ): Promise<string> {
    return await this.createNotification(
      userId,
      'Document Uploaded',
      `Your document for step ${stepNumber}: ${stepName} has been uploaded and is pending review.`,
      'info',
      { stepName, stepNumber, type: 'document_upload' }
    );
  }

  /**
   * Create system notifications
   */
  async notifySystemMaintenance(
    userId: string,
    message: string,
    scheduledTime?: Date
  ): Promise<string> {
    const title = scheduledTime ? 'Scheduled Maintenance' : 'System Maintenance';
    const fullMessage = scheduledTime 
      ? `Scheduled maintenance: ${message}. Time: ${scheduledTime.toLocaleString()}`
      : message;

    return await this.createNotification(
      userId,
      title,
      fullMessage,
      'warning',
      { type: 'system_maintenance', scheduledTime }
    );
  }

  async notifySystemUpdate(
    userId: string,
    message: string
  ): Promise<string> {
    return await this.createNotification(
      userId,
      'System Update',
      message,
      'info',
      { type: 'system_update' }
    );
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { notificationPreferences } = await collections();
      
      const prefs = await notificationPreferences.findOne({ userId });
      if (!prefs) return null;

      return {
        userId: prefs.userId,
        emailEnabled: prefs.emailEnabled || false,
        pushEnabled: prefs.pushEnabled || false,
        types: {
          clearance: prefs.types?.clearance !== false,
          approval: prefs.types?.approval !== false,
          rejection: prefs.types?.rejection !== false,
          completion: prefs.types?.completion !== false,
          system: prefs.types?.system !== false,
        },
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { notificationPreferences } = await collections();
      
      await notificationPreferences.updateOne(
        { userId },
        { $set: preferences },
        { upsert: true }
      );

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const { notifications } = await collections();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await notifications.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
