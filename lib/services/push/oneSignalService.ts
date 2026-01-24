// lib/services/push/oneSignalService.ts
'use client';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void>>;
  }
}

export type PermissionState = 'granted' | 'denied' | 'default';

export interface OneSignalSubscription {
  playerId: string | null;
  token: string | null;
  isSubscribed: boolean;
  permission: PermissionState;
}

export class OneSignalService {
  /**
   * Wait for OneSignal to be initialized
   */
  private static async waitForOneSignal(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('OneSignal only works in browser'));
        return;
      }

      // If already loaded
      if (window.OneSignal) {
        resolve(window.OneSignal);
        return;
      }

      // Wait for deferred initialization
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          resolve(OneSignal);
        });
      } else {
        // Wait a bit and try again (polling approach)
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max wait
        
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.OneSignal) {
            clearInterval(checkInterval);
            resolve(window.OneSignal);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('OneSignal failed to initialize'));
          }
        }, 100);
      }
    });
  }

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current permission state
   */
  static async getPermissionState(): Promise<PermissionState> {
    if (!this.isSupported()) return 'denied';

    try {
      const OneSignal = await this.waitForOneSignal();
      const permission = await OneSignal.Notifications.permissionNative;
      
      if (permission === 'granted') return 'granted';
      if (permission === 'denied') return 'denied';
      return 'default';
    } catch (error) {
      console.error('Error getting permission state:', error);
      return 'default';
    }
  }

  /**
   * Request push notification permission (triggered by user action)
   * This must be called in response to a user gesture (button click, etc.)
   */
  static async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      const OneSignal = await this.waitForOneSignal();
      
      // Request permission using OneSignal's API
      const permission = await OneSignal.Notifications.requestPermission();
      
      if (permission === 'granted') {
        // Automatically opt-in when permission is granted
        await OneSignal.User.PushSubscription.optIn();
      }
      
      return permission === 'granted' ? 'granted' : 
             permission === 'denied' ? 'denied' : 'default';
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }

  /**
   * Get current subscription status
   */
  static async getSubscription(): Promise<OneSignalSubscription> {
    if (!this.isSupported()) {
      return {
        playerId: null,
        token: null,
        isSubscribed: false,
        permission: 'denied',
      };
    }

    try {
      const OneSignal = await this.waitForOneSignal();
      const permission = await this.getPermissionState();
      
      const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
      const playerId = await OneSignal.User.PushSubscription.id || null;
      const token = await OneSignal.User.PushSubscription.token || null;

      return {
        playerId,
        token,
        isSubscribed: isSubscribed || false,
        permission,
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return {
        playerId: null,
        token: null,
        isSubscribed: false,
        permission: 'default',
      };
    }
  }

  /**
   * Subscribe user to push notifications
   */
  static async subscribe(): Promise<OneSignalSubscription> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const OneSignal = await this.waitForOneSignal();
      await OneSignal.User.PushSubscription.optIn();
      return await this.getSubscription();
    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  static async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const OneSignal = await this.waitForOneSignal();
      await OneSignal.User.PushSubscription.optOut();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }

  /**
   * Set external user ID (link OneSignal to your user)
   */
  static async setExternalUserId(userId: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const OneSignal = await this.waitForOneSignal();
      await OneSignal.login(userId);
      console.log('✅ OneSignal external user ID set:', userId);
    } catch (error) {
      console.error('Error setting external user ID:', error);
    }
  }

  /**
   * Remove external user ID (on logout)
   */
  static async removeExternalUserId(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const OneSignal = await this.waitForOneSignal();
      await OneSignal.logout();
    } catch (error) {
      console.error('Error removing external user ID:', error);
    }
  }
}


