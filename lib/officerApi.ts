import { z } from 'zod';
import { collections } from './mongoCollections';

// Officer data structure matching expected third-party API
export const OfficerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  position: z.string(),
  office: z.string(),
  role: z.string(),
  department: z.string(),
  departmentId: z.string(),
  isActive: z.boolean().default(true),
  assignedSteps: z.array(z.number()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Officer = z.infer<typeof OfficerSchema>;

export interface OfficerApiResponse {
  success: boolean;
  data?: Officer | Officer[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface OfficerApiConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout: number;
}

// Interface for future third-party API integration
export interface OfficerApiProvider {
  getOfficers(params?: { page?: number; limit?: number; department?: string }): Promise<OfficerApiResponse>;
  getOfficer(id: string): Promise<OfficerApiResponse>;
  createOfficer(officer: Omit<Officer, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfficerApiResponse>;
  updateOfficer(id: string, officer: Partial<Officer>): Promise<OfficerApiResponse>;
  deleteOfficer(id: string): Promise<OfficerApiResponse>;
  syncOfficers(): Promise<OfficerApiResponse>;
}

// Mock implementation using MongoDB
class MockOfficerApiProvider implements OfficerApiProvider {
  private config: OfficerApiConfig;

  constructor(config: OfficerApiConfig) {
    this.config = config;
  }

  async getOfficers(params?: { page?: number; limit?: number; department?: string }): Promise<OfficerApiResponse> {
    try {
      const { officers } = await collections();
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (params?.department) {
        query.department = params.department;
      }

      const [officersList, total] = await Promise.all([
        officers.find(query).skip(skip).limit(limit).toArray(),
        officers.countDocuments(query)
      ]);

      const formattedOfficers = officersList.map(officer => ({
        id: String(officer._id),
        name: officer.name,
        email: officer.email,
        position: officer.position || 'Officer',
        office: officer.office || 'General Office',
        role: officer.role || 'officer',
        department: officer.department || 'General',
        departmentId: officer.departmentId || '',
        isActive: officer.isActive !== false,
        assignedSteps: officer.assignedSteps || [],
        createdAt: officer.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: officer.updatedAt?.toISOString() || new Date().toISOString(),
      }));

      return {
        success: true,
        data: formattedOfficers,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching officers:', error);
      return {
        success: false,
        error: 'Failed to fetch officers'
      };
    }
  }

  async getOfficer(id: string): Promise<OfficerApiResponse> {
    try {
      const { officers } = await collections();
      const officer = await officers.findOne({ _id: new Object(id) });

      if (!officer) {
        return {
          success: false,
          error: 'Officer not found'
        };
      }

      const formattedOfficer = {
        id: String(officer._id),
        name: officer.name,
        email: officer.email,
        position: officer.position || 'Officer',
        office: officer.office || 'General Office',
        role: officer.role || 'officer',
        department: officer.department || 'General',
        departmentId: officer.departmentId || '',
        isActive: officer.isActive !== false,
        assignedSteps: officer.assignedSteps || [],
        createdAt: officer.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: officer.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return {
        success: true,
        data: formattedOfficer
      };
    } catch (error) {
      console.error('Error fetching officer:', error);
      return {
        success: false,
        error: 'Failed to fetch officer'
      };
    }
  }

  async createOfficer(officerData: Omit<Officer, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfficerApiResponse> {
    try {
      const { officers } = await collections();
      
      const newOfficer = {
        name: officerData.name,
        email: officerData.email,
        position: officerData.position,
        office: officerData.office,
        role: officerData.role,
        department: officerData.department,
        departmentId: officerData.departmentId,
        isActive: officerData.isActive,
        assignedSteps: officerData.assignedSteps,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await officers.insertOne(newOfficer);
      
      const createdOfficer = {
        id: String(result.insertedId),
        ...officerData,
        createdAt: newOfficer.createdAt.toISOString(),
        updatedAt: newOfficer.updatedAt.toISOString(),
      };

      return {
        success: true,
        data: createdOfficer
      };
    } catch (error) {
      console.error('Error creating officer:', error);
      return {
        success: false,
        error: 'Failed to create officer'
      };
    }
  }

  async updateOfficer(id: string, officerData: Partial<Officer>): Promise<OfficerApiResponse> {
    try {
      const { officers } = await collections();
      
      const updateData = {
        ...officerData,
        updatedAt: new Date(),
      };

      const result = await officers.updateOne(
        { _id: new Object(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Officer not found'
        };
      }

      // Fetch updated officer
      const updatedOfficer = await officers.findOne({ _id: new Object(id)  });
      if (!updatedOfficer) {
        return {
          success: false,
          error: 'Failed to fetch updated officer'
        };
      }

      const formattedOfficer = {
        id: String(updatedOfficer._id),
        name: updatedOfficer.name,
        email: updatedOfficer.email,
        position: updatedOfficer.position || 'Officer',
        office: updatedOfficer.office || 'General Office',
        role: updatedOfficer.role || 'officer',
        department: updatedOfficer.department || 'General',
        departmentId: updatedOfficer.departmentId || '',
        isActive: updatedOfficer.isActive !== false,
        assignedSteps: updatedOfficer.assignedSteps || [],
        createdAt: updatedOfficer.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: updatedOfficer.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return {
        success: true,
        data: formattedOfficer
      };
    } catch (error) {
      console.error('Error updating officer:', error);
      return {
        success: false,
        error: 'Failed to update officer'
      };
    }
  }

  async deleteOfficer(id: string): Promise<OfficerApiResponse> {
    try {
      const { officers } = await collections();
      
      const result = await officers.deleteOne({ _id: new Object(id)  });

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: 'Officer not found'
        };
      }

      return {
        success: true,
        data: { id } as Officer
      };
    } catch (error) {
      console.error('Error deleting officer:', error);
      return {
        success: false,
        error: 'Failed to delete officer'
      };
    }
  }

  async syncOfficers(): Promise<OfficerApiResponse> {
    try {
      // In a real implementation, this would sync with external API
      // For now, we'll just return the current officers
      return await this.getOfficers();
    } catch (error) {
      console.error('Error syncing officers:', error);
      return {
        success: false,
        error: 'Failed to sync officers'
      };
    }
  }
}

// Future third-party API implementation (placeholder)
class ExternalOfficerApiProvider implements OfficerApiProvider {
  private config: OfficerApiConfig;

  constructor(config: OfficerApiConfig) {
    this.config = config;
  }

  async getOfficers(params?: { page?: number; limit?: number; department?: string }): Promise<OfficerApiResponse> {
    // TODO: Implement external API calls
    throw new Error('External officer API not implemented yet');
  }

  async getOfficer(id: string): Promise<OfficerApiResponse> {
    // TODO: Implement external API calls
    throw new Error('External officer API not implemented yet');
  }

  async createOfficer(officer: Omit<Officer, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfficerApiResponse> {
    // TODO: Implement external API calls
    throw new Error('External officer API not implemented yet');
  }

  async updateOfficer(id: string, officer: Partial<Officer>): Promise<OfficerApiResponse> {
    // TODO: Implement external API calls
    throw new Error('External officer API not implemented yet');
  }

  async deleteOfficer(id: string): Promise<OfficerApiResponse> {
    // TODO: Implement external API calls
    throw new Error('External officer API not implemented yet');
  }

  async syncOfficers(): Promise<OfficerApiResponse> {
    // TODO: Implement external API calls
    throw new Error('External officer API not implemented yet');
  }
}

// Factory function to create the appropriate provider
export function createOfficerApiProvider(config: OfficerApiConfig): OfficerApiProvider {
  const useExternalApi = process.env.USE_EXTERNAL_OFFICER_API === 'true';
  
  if (useExternalApi) {
    return new ExternalOfficerApiProvider(config);
  }
  
  return new MockOfficerApiProvider(config);
}

// Default configuration
const defaultConfig: OfficerApiConfig = {
  baseUrl: process.env.OFFICER_API_BASE_URL,
  apiKey: process.env.OFFICER_API_KEY,
  timeout: 10000,
};

// Export singleton instance
export const officerApi = createOfficerApiProvider(defaultConfig);

// Utility functions
export async function getOfficersByStep(stepNumber: number): Promise<Officer[]> {
  const response = await officerApi.getOfficers();
  if (!response.success || !Array.isArray(response.data)) {
    return [];
  }
  
  return response.data.filter(officer => 
    officer.assignedSteps.includes(stepNumber) && officer.isActive
  );
}

export async function getOfficerById(id: string): Promise<Officer | null> {
  const response = await officerApi.getOfficer(id);
  if (!response.success || !response.data) {
    return null;
  }
  
  return Array.isArray(response.data) ? response.data[0] : response.data;
}
