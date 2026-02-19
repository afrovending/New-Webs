/**
 * Push Notification Service for AfroVending
 * Handles push notification subscription and management
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// VAPID public key - this should be generated and stored securely
// For production, generate your own key pair using web-push library
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Service Worker not ready:', error);
      return false;
    }
  }

  async getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, error: 'Push notifications not supported' };
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        return { success: true, permission };
      } else {
        return { success: false, permission, error: 'Permission denied' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async subscribe(userId) {
    if (!this.isSupported || !this.swRegistration) {
      return { success: false, error: 'Push notifications not available' };
    }

    try {
      // Check existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Send subscription to backend
      const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      return { success: true, subscription };
    } catch (error) {
      console.error('Push subscription error:', error);
      return { success: false, error: error.message };
    }
  }

  async unsubscribe() {
    if (!this.swRegistration) {
      return { success: false, error: 'Service worker not ready' };
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from backend
        await fetch(`${API_URL}/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return { success: false, error: error.message };
    }
  }

  async isSubscribed() {
    if (!this.swRegistration) return false;
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  }

  // Utility to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification (for testing)
  async showLocalNotification(title, options = {}) {
    if (!this.swRegistration) {
      console.warn('Service worker not ready');
      return;
    }

    const defaultOptions = {
      body: 'AfroVending notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      tag: 'afrovending-local',
      ...options
    };

    await this.swRegistration.showNotification(title, defaultOptions);
  }
}

export const pushService = new PushNotificationService();
export default pushService;
