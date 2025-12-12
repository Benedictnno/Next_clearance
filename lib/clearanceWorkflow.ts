
import { prisma } from '@/lib/prisma';
import { ObjectId } from 'mongodb'; // Keep for ID validation if needed or remove if strictly Prisma
import { notificationService } from './notificationService';
import { StepStatus } from '@prisma/client';

/**
 * Clearance Workflow Service
 * 
 * Re-implemented with Prisma and Enhanced Two-Tier Logic
 */

// Ten clearance offices/steps
export const CLEARANCE_OFFICES = [
  { id: 'department_hod', aliases: ['hod', 'department'], name: 'Head of Department (HOD)', step: 1, isDepartmentSpecific: true },
  { id: 'faculty_officer', aliases: ['faculty', 'faculty_officer'], name: 'Faculty Officer', step: 2, isDepartmentSpecific: false },
  { id: 'university_librarian', aliases: ['library', 'librarian'], name: 'University Librarian', step: 3, isDepartmentSpecific: false },
  { id: 'exams_transcript', aliases: ['exams', 'transcript'], name: 'Exams and Transcript Office', step: 4, isDepartmentSpecific: false },
  { id: 'bursary', aliases: ['bursar', 'bursary'], name: 'Bursary', step: 5, isDepartmentSpecific: false },
  { id: 'sports_council', aliases: ['sports'], name: 'Sports Council', step: 6, isDepartmentSpecific: false },
  { id: 'alumni_association', aliases: ['alumni'], name: 'Alumni Association', step: 7, isDepartmentSpecific: false },
  { id: 'internal_audit', aliases: ['audit'], name: 'Internal Audit', step: 8, isDepartmentSpecific: false },
  { id: 'student_affairs', aliases: ['student_affairs', 'student-affairs'], name: 'Student Affairs', step: 9, isDepartmentSpecific: false },
  { id: 'security_office', aliases: ['security'], name: 'Security Office', step: 10, isDepartmentSpecific: false },
] as const;

export type OfficeId = typeof CLEARANCE_OFFICES[number]['id'];

// Helper to find office by ID or Alias
function findOffice(idOrAlias: string) {
  const norm = idOrAlias.toLowerCase();
  return CLEARANCE_OFFICES.find(o => o.id === norm || (o.aliases as readonly string[]).includes(norm));
}

export interface ClearanceSubmission {
  id: string;
  studentId: string;
  studentMatricNumber?: string;
  studentName?: string;
  officeId: string;
  officeName: string;
  officerId?: string;
  documents: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface StudentClearanceStatus {
  studentId: string;
  studentName?: string;
  studentMatricNumber?: string;
  offices: Array<{
    officeId: string;
    officeName: string;
    stepNumber: number;
    status: 'not_started' | 'pending' | 'approved' | 'rejected';
    submittedAt?: Date;
    reviewedAt?: Date;
    comment?: string;
    canSubmit: boolean;
  }>;
  overallProgress: number; // Percentage
  isCompleted: boolean;
  canAccessFinalForms: boolean;
}

class ClearanceWorkflowService {

  private getSubmissionKey(officeId: string, departmentId?: string): string {
    const office = findOffice(officeId);
    if (!office) throw new Error(`Invalid office ID: ${officeId}`);

    if (office.isDepartmentSpecific) {
      if (!departmentId) throw new Error("Department ID required for HOD submission key");
      return `hod-${departmentId}`;
    }
    return office.id; // Always use canonical ID for submission key logic
  }

  /**
   * Submit clearance documents to a specific office
   */
  async submitToOffice(
    studentId: string,
    studentName: string,
    studentMatricNumber: string,
    officeId: string,
    documents: Array<{ fileName: string; fileUrl: string; fileType: string }>,
    officerId?: string
  ): Promise<{ success: boolean; message: string; submissionId?: string }> {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      // 1. Get Student & Department
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { department: true }
      });

      if (!student || !student.departmentId) {
        return { success: false, message: 'Student or Department not found' };
      }

      // 2. Validate Office
      const office = findOffice(officeId);
      if (!office) {
        return { success: false, message: 'Invalid office ID' };
      }

      // 3. Logic: Submission Key
      const submissionKey = this.getSubmissionKey(office.id, student.departmentId);

      // 3.5. Check if HOD is assigned for department-specific offices
      if (office.isDepartmentSpecific) {
        const department = await prisma.department.findUnique({
          where: { id: student.departmentId },
          include: { hodOfficer: true }
        });

        if (!department?.hodOfficer) {
          return {
            success: false,
            message: `HOD Not Assigned: Your department (${student.department?.name}) does not have an assigned Head of Department yet. Please contact administration.`
          };
        }
      }

      // 4. Logic: HOD First Rule
      if (!office.isDepartmentSpecific) {
        // Find HOD submission
        const hodKey = `hod-${student.departmentId}`;
        const hodSubmission = await prisma.clearanceProgress.findFirst({
          where: {
            request: { studentId: studentId },
            submissionKey: hodKey,
            status: 'APPROVED' // StepStatus enum
          }
        });

        if (!hodSubmission) {
          return {
            success: false,
            message: `Locked: You must complete HOD clearance (${student.department?.name}) first.`
          };
        }
      }

      // 5. Check Existing for THIS office
      // We need to find the ClearanceRequest first or create it?
      // The schema has `ClearanceRequest` (one per student?? No, "instance per student"). 
      // Yes, `ClearanceRequest` seems to be the parent container.

      let request = await prisma.clearanceRequest.findFirst({
        where: { studentId: studentId }
      });

      if (!request) {
        request = await prisma.clearanceRequest.create({
          data: {
            studentId: studentId,
            status: 'PENDING'
          }
        });
      }

      const existingSubmission = await prisma.clearanceProgress.findUnique({
        where: {
          requestId_submissionKey: {
            requestId: request.id,
            submissionKey: submissionKey
          }
        }
      });

      if (existingSubmission && existingSubmission.status === 'APPROVED') {
        return {
          success: false,
          message: 'This office has already approved your clearance'
        };
      }

      const now = new Date();
      // Map documents to new Prisma Schema Document inputs if needed or just store in Document collection
      // Schema has `documents Document[]`. We need to create them.

      if (existingSubmission) {
        // Update
        await prisma.clearanceProgress.update({
          where: { id: existingSubmission.id },
          data: {
            status: 'PENDING',
            // submittedAt removed as it doesn't exist on schema
            comment: null,
            officerId: null, // Clear assigned officer?
            actionedAt: null,
          }
        });

        // Handle Documents: Delete old linked docs
        await prisma.document.deleteMany({
          where: { clearanceProgressId: existingSubmission.id }
        });

        // Create new docs
        for (const doc of documents) {
          await prisma.document.create({
            data: {
              fileName: doc.fileName,
              fileSize: 0, // Placeholder
              mimeType: doc.fileType,
              documentType: 'CLEARANCE_FORM', // Enum
              cloudinaryPublicId: 'placeholder',
              cloudinaryUrl: doc.fileUrl,
              clearanceProgressId: existingSubmission.id,
              studentId: studentId
            }
          });
        }

        // Notification
        if (officerId) {
          await notificationService.createNotification(
            officerId,
            'Clearance Resubmission',
            `${studentName} has resubmitted for ${office.name}`,
            'info',
            { type: 'clearance_resubmission', officeId: office.id, studentId }
          );
        }

        return { success: true, message: 'Resubmitted successfully', submissionId: existingSubmission.id };

      } else {
        // Create New
        const newSubmission = await prisma.clearanceProgress.create({
          data: {
            requestId: request.id,
            submissionKey: submissionKey,
            officeId: office.id,
            officeName: office.name,
            isDepartmentSpecific: office.isDepartmentSpecific,
            studentDepartment: office.isDepartmentSpecific ? student.department?.name : null,
            stepNumber: office.step,
            status: 'PENDING',
            // Create Documents inline
            documents: {
              create: documents.map(doc => ({
                fileName: doc.fileName,
                fileSize: 0,
                mimeType: doc.fileType,
                documentType: 'CLEARANCE_FORM',
                cloudinaryPublicId: 'placeholder',
                cloudinaryUrl: doc.fileUrl,
                studentId: studentId
              }))
            }
          }
        });

        // Notification logic...
        return { success: true, message: 'Submitted successfully', submissionId: newSubmission.id };
      }

    } catch (error) {
      console.error('Error submitting to office:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit documents',
      };
    }
  }

  /**
   * Get student's clearance status across all offices
   */
  async getStudentStatus(studentId: string): Promise<StudentClearanceStatus> {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { department: true }
      });

      if (!student) throw new Error("Student not found");

      const request = await prisma.clearanceRequest.findFirst({
        where: { studentId },
        include: {
          steps: {
            include: { documents: true }
          }
        }
      });

      // Determine if HOD is approved
      const hodKey = student.departmentId ? `hod-${student.departmentId}` : 'hod-unknown';
      const hodApproved = request?.steps.some(s => s.submissionKey === hodKey && s.status === 'APPROVED');

      const offices = CLEARANCE_OFFICES.map(office => {
        // Determine Submission Key for THIS office
        const subKey = office.isDepartmentSpecific && student.departmentId
          ? `hod-${student.departmentId}`
          : office.id;

        const submission = request?.steps.find(s => s.submissionKey === subKey);

        // Access logic
        const canSubmit = office.isDepartmentSpecific || !!hodApproved;

        return {
          officeId: office.id,
          officeName: office.name,
          stepNumber: office.step,
          status: submission ? (submission.status.toLowerCase() as any) : 'not_started',
          submittedAt: submission?.createdAt,
          reviewedAt: submission?.actionedAt || undefined,
          comment: submission?.comment || undefined,
          canSubmit
        };
      });

      // Stats
      const approvedCount = offices.filter(o => o.status === 'approved').length;
      const overallProgress = Math.round((approvedCount / CLEARANCE_OFFICES.length) * 100);
      const isCompleted = approvedCount === CLEARANCE_OFFICES.length;

      return {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        studentMatricNumber: student.matricNumber,
        offices,
        overallProgress,
        isCompleted,
        canAccessFinalForms: isCompleted
      };

    } catch (error) {
      console.error('Error getting student status:', error);
      throw error;
    }
  }

  async getOfficeStatistics(officeId: string, departmentFilter?: string | null) {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      const office = findOffice(officeId);
      if (!office) {
        // Fallback or specific handling for dynamic office IDs if any, otherwise throw
        // If officeId is not in the static list, we can't filter easily unless we assume it's a submission key?
        // For now, adhere to the list.
        throw new Error(`Invalid office ID: ${officeId}`);
      }

      let whereClause: any = {};

      if (office.isDepartmentSpecific) {
        if (departmentFilter) {
          whereClause.submissionKey = `hod-${departmentFilter}`;
        } else {
          whereClause.submissionKey = { startsWith: 'hod-' };
        }
      } else {
        whereClause.submissionKey = office.id;
      }

      const [pending, approved, rejected] = await Promise.all([
        prisma.clearanceProgress.count({ where: { ...whereClause, status: 'PENDING' } }),
        prisma.clearanceProgress.count({ where: { ...whereClause, status: 'APPROVED' } }),
        prisma.clearanceProgress.count({ where: { ...whereClause, status: 'REJECTED' } })
      ]);

      return {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      };

    } catch (error) {
      console.error('Error getting office stats:', error);
      throw error;
    }
  }

  /**
   * Get pending submissions for a specific officer/office
   */
  async getOfficePendingSubmissions(
    officeId: string,
    officerId?: string,
    departmentFilter?: string // Passed if officer is restricted
  ): Promise<ClearanceSubmission[]> {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      // Logic: Filter by Submission Key
      // If HOD: key starts with "hod-". If officer has dept, key = "hod-{dept}".
      // If University: key = "{officeId}".

      const office = findOffice(officeId);
      if (!office) throw new Error("Invalid office");

      let whereClause: any = {
        status: 'PENDING'
      };

      if (office.isDepartmentSpecific) {
        if (departmentFilter) {
          whereClause.submissionKey = `hod-${departmentFilter}`;
        } else {
          whereClause.submissionKey = { startsWith: 'hod-' };
        }
      } else {
        whereClause.submissionKey = office.id;
      }

      const submissions = await prisma.clearanceProgress.findMany({
        where: whereClause,
        include: {
          request: {
            include: { student: true }
          },
          documents: true
        },
        orderBy: { createdAt: 'asc' }
      });

      return submissions.map(s => ({
        id: s.id,
        studentId: s.request.studentId,
        studentName: `${s.request.student.firstName} ${s.request.student.lastName}`,
        studentMatricNumber: s.request.student.matricNumber,
        officeId: s.officeId, // This might be canonical or stored ID
        officeName: s.officeName,
        documents: s.documents.map(d => ({
          fileName: d.fileName,
          fileUrl: d.cloudinaryUrl,
          fileType: d.mimeType,
          uploadedAt: d.createdAt
        })),
        status: s.status.toLowerCase() as any,
        comment: s.comment || undefined,
        submittedAt: s.createdAt,
        reviewedAt: s.actionedAt || undefined,
        reviewedBy: s.officerId || undefined
      }));

    } catch (error) {
      console.error('Error getting pending submissions:', error);
      throw error;
    }
  }

  /**
   * Get ALL submissions for a specific office (including reviewed ones)
   */
  async getOfficeAllSubmissions(
    officeId: string,
    departmentFilter?: string // Passed if officer is restricted
  ): Promise<ClearanceSubmission[]> {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      const office = findOffice(officeId);
      if (!office) throw new Error("Invalid office");

      let whereClause: any = {};

      if (office.isDepartmentSpecific) {
        if (departmentFilter) {
          whereClause.submissionKey = `hod-${departmentFilter}`;
        } else {
          whereClause.submissionKey = { startsWith: 'hod-' };
        }
      } else {
        whereClause.submissionKey = office.id;
      }

      const submissions = await prisma.clearanceProgress.findMany({
        where: whereClause,
        include: {
          request: {
            include: { student: true }
          },
          documents: true
        },
        orderBy: { createdAt: 'desc' } // Most recent first
      });

      return submissions.map(s => ({
        id: s.id,
        studentId: s.request.studentId,
        studentName: `${s.request.student.firstName} ${s.request.student.lastName}`,
        studentMatricNumber: s.request.student.matricNumber,
        officeId: s.officeId,
        officeName: s.officeName,
        documents: s.documents.map(d => ({
          fileName: d.fileName,
          fileUrl: d.cloudinaryUrl,
          fileType: d.mimeType,
          uploadedAt: d.createdAt
        })),
        status: s.status.toLowerCase() as any,
        comment: s.comment || undefined,
        submittedAt: s.createdAt,
        reviewedAt: s.actionedAt || undefined,
        reviewedBy: s.officerId || undefined
      }));

    } catch (error) {
      console.error('Error getting all submissions:', error);
      throw error;
    }
  }

  /**
   * Get a single submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<ClearanceSubmission | null> {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      const submission = await prisma.clearanceProgress.findUnique({
        where: { id: submissionId },
        include: {
          request: {
            include: { student: true }
          },
          documents: true
        }
      });

      if (!submission) return null;

      return {
        id: submission.id,
        studentId: submission.request.studentId,
        studentName: `${submission.request.student.firstName} ${submission.request.student.lastName}`,
        studentMatricNumber: submission.request.student.matricNumber,
        officeId: submission.officeId,
        officeName: submission.officeName,
        documents: submission.documents.map(d => ({
          fileName: d.fileName,
          fileUrl: d.cloudinaryUrl,
          fileType: d.mimeType,
          uploadedAt: d.createdAt
        })),
        status: submission.status.toLowerCase() as any,
        comment: submission.comment || undefined,
        submittedAt: submission.createdAt,
        reviewedAt: submission.actionedAt || undefined,
        reviewedBy: submission.officerId || undefined
      };

    } catch (error) {
      console.error('Error getting submission by ID:', error);
      throw error;
    }
  }

  /**
   * Check if student can access final forms (NYSC, etc.)
   * Returns true if all clearance steps are approved
   */
  async canAccessFinalForms(studentId: string): Promise<boolean> {
    try {
      if (!prisma) throw new Error("Prisma client not initialized");

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { department: true }
      });

      if (!student) return false;

      const request = await prisma.clearanceRequest.findFirst({
        where: { studentId },
        include: { steps: true }
      });

      if (!request) return false;

      // Check if all offices are approved
      const hodKey = student.departmentId ? `hod-${student.departmentId}` : 'hod-unknown';

      // Count approved submissions
      const approvedCount = request.steps.filter(s => s.status === 'APPROVED').length;

      // Student needs all 10 offices approved
      return approvedCount === CLEARANCE_OFFICES.length;

    } catch (error) {
      console.error('Error checking final forms access:', error);
      return false;
    }
  }

  // ... (Other methods implement similarly, keeping brevity)

  async approveSubmission(submissionId: string, officerId: string, comment?: string) {
    if (!prisma) throw new Error("No Prisma");
    await prisma.clearanceProgress.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        comment,
        officerId,
        actionedAt: new Date()
      }
    });
    // Notifications logic...
    return { success: true, message: "Approved" };
  }

  async rejectSubmission(submissionId: string, officerId: string, reason: string) {
    if (!prisma) throw new Error("No Prisma");
    await prisma.clearanceProgress.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        comment: reason,
        officerId,
        actionedAt: new Date()
      }
    });
    // Notifications logic...
    return { success: true, message: "Rejected" };
  }
}

export const clearanceWorkflow = new ClearanceWorkflowService();
