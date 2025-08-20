import { QueryClient } from '@tanstack/react-query';

export class ApiService {
  private static instance: ApiService;
  private queryClient: QueryClient;
  private offlineQueue: Array<{
    method: string;
    endpoint: string;
    data?: any;
    timestamp: number;
  }> = [];

  private constructor() {
    this.queryClient = new QueryClient();
    this.initializeOfflineSupport();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private initializeOfflineSupport() {
    window.addEventListener('online', this.processOfflineQueue.bind(this));
    window.addEventListener('offline', () => {
      console.log('Application is offline. Operations will be queued.');
    });
  }

  private async processOfflineQueue() {
    if (navigator.onLine && this.offlineQueue.length > 0) {
      console.log('Processing offline queue...');
      
      const queue = [...this.offlineQueue];
      this.offlineQueue = [];

      for (const operation of queue) {
        try {
          await this.makeRequest(
            operation.method,
            operation.endpoint,
            operation.data
          );
        } catch (error) {
          console.error('Error processing offline operation:', error);
          this.offlineQueue.push(operation);
        }
      }
    }
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    if (!navigator.onLine) {
      this.offlineQueue.push({
        method,
        endpoint,
        data,
        timestamp: Date.now(),
      });
      throw new Error('Offline - Operation queued');
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (!navigator.onLine) {
        this.offlineQueue.push({
          method,
          endpoint,
          data,
          timestamp: Date.now(),
        });
      }
      throw error;
    }
  }

  public async get(endpoint: string): Promise<any> {
    return this.makeRequest('GET', endpoint);
  }

  public async post(endpoint: string, data: any): Promise<any> {
    return this.makeRequest('POST', endpoint, data);
  }

  public async put(endpoint: string, data: any): Promise<any> {
    return this.makeRequest('PUT', endpoint, data);
  }

  public async delete(endpoint: string): Promise<any> {
    return this.makeRequest('DELETE', endpoint);
  }

  public getQueryClient(): QueryClient {
    return this.queryClient;
  }
} 