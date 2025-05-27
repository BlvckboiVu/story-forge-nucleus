import { ApiService } from '@/services/api.service';

export abstract class BaseRepository<T> {
  protected apiService: ApiService;
  protected endpoint: string;

  constructor(endpoint: string) {
    this.apiService = ApiService.getInstance();
    this.endpoint = endpoint;
  }

  async findAll(): Promise<T[]> {
    return this.apiService.get(this.endpoint);
  }

  async findById(id: string): Promise<T> {
    return this.apiService.get(`${this.endpoint}/${id}`);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.apiService.post(this.endpoint, data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.apiService.put(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.apiService.delete(`${this.endpoint}/${id}`);
  }

  protected handleError(error: any): never {
    console.error('Repository Error:', error);
    throw error;
  }
} 