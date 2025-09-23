import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:5274/api').replace(/\/+$/, '');

export interface FeatureFlags {
  consultantRegistrationEnabled: boolean;
  messagingEnabled: boolean;
}

class FeatureFlagService {
  private cache: FeatureFlags | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getFeatureFlags(): Promise<FeatureFlags> {
    const now = Date.now();
    
    // Return cached data if it's still valid
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const [consultantRegistrationResponse, messagingResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/Auth/consultant-registration-status`),
        axios.get(`${API_BASE_URL}/Auth/messaging-status`)
      ]);

      const flags: FeatureFlags = {
        consultantRegistrationEnabled: consultantRegistrationResponse.data.isEnabled,
        messagingEnabled: messagingResponse.data.isEnabled
      };

      // Cache the result
      this.cache = flags;
      this.cacheExpiry = now + this.CACHE_DURATION;

      return flags;
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      
      // Return default values on error
      return {
        consultantRegistrationEnabled: false,
        messagingEnabled: false
      };
    }
  }

  async isMessagingEnabled(): Promise<boolean> {
    const flags = await this.getFeatureFlags();
    return flags.messagingEnabled;
  }

  async isConsultantRegistrationEnabled(): Promise<boolean> {
    const flags = await this.getFeatureFlags();
    return flags.consultantRegistrationEnabled;
  }

  // Method to clear cache (useful for admin updates)
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}

export default new FeatureFlagService();