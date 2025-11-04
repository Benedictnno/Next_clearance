import { z } from 'zod';

// External API response schema
const ExternalStudentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  matricNumber: z.string(),
  department: z.string(),
  faculty: z.string(),
  level: z.string(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  status: z.string().optional(),
  admissionYear: z.string().optional(),
  graduationYear: z.string().optional(),
});

export type ExternalStudent = z.infer<typeof ExternalStudentSchema>;

export interface ExternalApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

class ExternalStudentApiService {
  private config: ExternalApiConfig;

  constructor(config: ExternalApiConfig) {
    this.config = config;
  }

  /**
   * Fetch student data from external API
   */
  async fetchStudent(studentId: string): Promise<ExternalStudent | null> {
    try {
      const url = `${this.config.baseUrl}/api/users/${studentId}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`External API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return ExternalStudentSchema.parse(data);
    } catch (error) {
      console.error('Error fetching student from external API:', error);
      return null;
    }
  }

  /**
   * Validate student credentials against external API
   */
  async validateStudent(matricNumber: string, password?: string): Promise<ExternalStudent | null> {
    try {
      // For now, we'll fetch by matric number through the user ID
      // This assumes the external API has a way to search by matric number
      const url = `${this.config.baseUrl}/api/users/search?matric=${encodeURIComponent(matricNumber)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`External API validation error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return ExternalStudentSchema.parse(data);
    } catch (error) {
      console.error('Error validating student with external API:', error);
      return null;
    }
  }

  /**
   * Sync student data to local database
   */
  async syncStudentToLocal(student: ExternalStudent, userId: string): Promise<void> {
    try {
      const { collections } = await import('./mongoCollections');
      const { students } = await collections();

      await students.updateOne(
        { userId: userId },
        {
          $set: {
            firstName: student.firstName,
            lastName: student.lastName,
            matricNumber: student.matricNumber,
            department: student.department,
            faculty: student.faculty,
            level: student.level,
            phoneNumber: student.phoneNumber,
            address: student.address,
            dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
            gender: student.gender,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error syncing student to local database:', error);
      throw error;
    }
  }
}

// Default configuration
const defaultConfig: ExternalApiConfig = {
  baseUrl: process.env.EXTERNAL_API_BASE_URL || 'https://coreeksu.vercel.app',
  apiKey: process.env.EXTERNAL_API_KEY,
  timeout: 10000, // 10 seconds
};

// Export singleton instance
export const externalStudentApi = new ExternalStudentApiService(defaultConfig);

// Utility functions for common operations
export async function fetchAndSyncStudent(studentId: string, userId: string): Promise<ExternalStudent | null> {
  const student = await externalStudentApi.fetchStudent(studentId);
  if (student) {
    await externalStudentApi.syncStudentToLocal(student, userId);
  }
  return student;
}

export async function validateAndSyncStudent(matricNumber: string, userId: string): Promise<ExternalStudent | null> {
  const student = await externalStudentApi.validateStudent(matricNumber);
  if (student) {
    await externalStudentApi.syncStudentToLocal(student, userId);
  }
  return student;
}
