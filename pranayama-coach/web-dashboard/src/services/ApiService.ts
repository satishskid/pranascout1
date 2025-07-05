import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Types
export interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    height?: number;
    weight?: number;
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
    avatar?: string;
  };
  subscription: {
    plan: 'free' | 'premium' | 'family';
    status: 'active' | 'canceled' | 'expired' | 'trial';
    startDate: Date;
    endDate?: Date;
  };
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface Session {
  _id: string;
  userId: string;
  type: 'pranayama' | 'meditation';
  startTime: Date;
  endTime: Date;
  duration: number;
  completed: boolean;
  vitalSigns: {
    avgHeartRate?: number;
    avgHRV?: number;
    avgSpO2?: number;
    avgBreathingRate?: number;
    stressLevel?: number;
  };
  userExperience: {
    difficultyRating?: number;
    energyBefore?: number;
    energyAfter?: number;
    stressBefore?: number;
    stressAfter?: number;
    enjoymentRating?: number;
  };
}

export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  userGrowth: Array<{ date: string; count: number }>;
  sessionsByType: Array<{ type: string; count: number }>;
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    retentionRate: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ApiServiceClass {
  private baseURL = API_BASE_URL;

  // Users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subscription?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await axios.get(
      `${this.baseURL}/admin/users`,
      { params }
    );
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await axios.get(
      `${this.baseURL}/admin/users/${userId}`
    );
    return response.data.user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await axios.put(
      `${this.baseURL}/admin/users/${userId}`,
      updates
    );
    return response.data.user;
  }

  async deleteUser(userId: string): Promise<void> {
    await axios.delete(`${this.baseURL}/admin/users/${userId}`);
  }

  async exportUsers(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response: AxiosResponse<Blob> = await axios.get(
      `${this.baseURL}/admin/users/export`,
      {
        params: { format },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Sessions
  async getSessions(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Session>> {
    const response: AxiosResponse<PaginatedResponse<Session>> = await axios.get(
      `${this.baseURL}/admin/sessions`,
      { params }
    );
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response: AxiosResponse<{ session: Session }> = await axios.get(
      `${this.baseURL}/admin/sessions/${sessionId}`
    );
    return response.data.session;
  }

  async getUserSessions(userId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<Session>> {
    const response: AxiosResponse<PaginatedResponse<Session>> = await axios.get(
      `${this.baseURL}/admin/users/${userId}/sessions`,
      { params }
    );
    return response.data;
  }

  async exportSessions(params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> {
    const response: AxiosResponse<Blob> = await axios.get(
      `${this.baseURL}/admin/sessions/export`,
      {
        params: { format: 'csv', ...params },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Analytics
  async getAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<Analytics> {
    const response: AxiosResponse<Analytics> = await axios.get(
      `${this.baseURL}/admin/analytics`,
      { params: { period } }
    );
    return response.data;
  }

  async getEngagementMetrics(startDate?: string, endDate?: string): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/admin/analytics/engagement`,
      { params: { startDate, endDate } }
    );
    return response.data;
  }

  async getRetentionMetrics(): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/admin/analytics/retention`
    );
    return response.data;
  }

  async getVitalSignsAnalytics(params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/admin/analytics/vital-signs`,
      { params }
    );
    return response.data;
  }

  // Health checks and system status
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      database: 'up' | 'down';
      redis: 'up' | 'down';
      storage: 'up' | 'down';
    };
    version: string;
    uptime: number;
  }> {
    const response = await axios.get(`${this.baseURL}/health`);
    return response.data;
  }

  async getSystemMetrics(): Promise<{
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    requestCount: number;
  }> {
    const response = await axios.get(`${this.baseURL}/admin/system/metrics`);
    return response.data;
  }

  // Notifications and alerts
  async sendNotification(params: {
    userIds?: string[];
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    channels: ('push' | 'email' | 'in-app')[];
  }): Promise<void> {
    await axios.post(`${this.baseURL}/admin/notifications/send`, params);
  }

  async getNotificationHistory(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await axios.get(
      `${this.baseURL}/admin/notifications/history`,
      { params }
    );
    return response.data;
  }

  // Configuration
  async getAppConfig(): Promise<any> {
    const response = await axios.get(`${this.baseURL}/admin/config`);
    return response.data;
  }

  async updateAppConfig(config: any): Promise<any> {
    const response = await axios.put(`${this.baseURL}/admin/config`, config);
    return response.data;
  }

  // Subscriptions
  async getSubscriptionMetrics(): Promise<any> {
    const response = await axios.get(`${this.baseURL}/admin/subscriptions/metrics`);
    return response.data;
  }

  async getRevenueMetrics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/admin/revenue/metrics`,
      { params: { period } }
    );
    return response.data;
  }
}

export const ApiService = new ApiServiceClass();