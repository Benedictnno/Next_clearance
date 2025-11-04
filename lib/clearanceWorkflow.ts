import { ObjectId } from 'mongodb';
import { collections, ClearanceSubmissionDoc } from './mongoCollections';
import { notificationService } from './notificationService';

/**
 * Clearance Workflow Service
 * 
 * This service manages the office-specific clearance workflow where:
 * - Students submit documents to 10 different offices in sequence
 * - Each office reviews and approves/rejects submissions
 * - Officers only see submissions for their office
 * - All offices must approve before student can access final forms
 */

// Ten clearance offices/steps
export const CLEARANCE_OFFICES = [
  { id: 'department_hod', name: 'Head of Department (HOD)', step: 1, isDepartmentSpecific: true },
  { id: 'faculty_officer', name: 'Faculty Officer', step: 2, isDepartmentSpecific: false },
  { id: 'university_librarian', name: 'University Librarian', step: 3, isDepartmentSpecific: false },
  { id: 'exams_transcript', name: 'Exams and Transcript Office', step: 4, isDepartmentSpecific: false },
  { id: 'bursary', name: 'Bursary', step: 5, isDepartmentSpecific: false },
  { id: 'sports_council', name: 'Sports Council', step: 6, isDepartmentSpecific: false },
  { id: 'alumni_association', name: 'Alumni Association', step: 7, isDepartmentSpecific: false },
  { id: 'internal_audit', name: 'Internal Audit', step: 8, isDepartmentSpecific: false },
  { id: 'student_affairs', name: 'Student Affairs', step: 9, isDepartmentSpecific: false },
  { id: 'security_office', name: 'Security Office', step: 10, isDepartmentSpecific: false },
] as const;

export type OfficeId = typeof CLEARANCE_OFFICES[number]['id'];

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
  }>;
  overallProgress: number; // Percentage
  isCompleted: boolean;
  canAccessFinalForms: boolean;
}

class ClearanceWorkflowService {
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
      const { clearances } = await collections();

      // Validate office exists
      const office = CLEARANCE_OFFICES.find(o => o.id === officeId);
      if (!office) {
        return { success: false, message: 'Invalid office ID' };
      }

      // Check if submission already exists for this office
      const existingSubmission = await clearances.findOne({
        studentId,
        officeId,
      });

      if (existingSubmission && existingSubmission.status === 'approved') {
        return { 
          success: false, 
          message: 'This office has already approved your clearance' 
        };
      }

      const now = new Date();
      const submissionData: ClearanceSubmissionDoc = {
        studentId,
        studentMatricNumber,
        studentName,
        officeId,
        officeName: office.name,
        officerId,
        documents: documents.map(doc => ({
          ...doc,
          uploadedAt: now,
        })),
        status: 'pending',
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      if (existingSubmission) {
        // Update existing submission
        await clearances.updateOne(
          { _id: existingSubmission._id },
          {
            $set: {
              documents: submissionData.documents,
              status: 'pending',
              submittedAt: now,
              updatedAt: now,
              comment: undefined, // Clear previous comments
              reviewedAt: undefined,
              reviewedBy: undefined,
            },
          }
        );

        // Notify officer of resubmission
        if (officerId) {
          await notificationService.createNotification(
            officerId,
            'Clearance Resubmission',
            `${studentName} (${studentMatricNumber}) has resubmitted documents for ${office.name}`,
            'info',
            { type: 'clearance_resubmission', officeId, studentId }
          );
        }

        return {
          success: true,
          message: 'Documents resubmitted successfully',
          submissionId: String(existingSubmission._id),
        };
      } else {
        // Create new submission
        const result = await clearances.insertOne(submissionData);

        // Notify officer of new submission
        if (officerId) {
          await notificationService.createNotification(
            officerId,
            'New Clearance Submission',
            `${studentName} (${studentMatricNumber}) has submitted documents for ${office.name}`,
            'info',
            { type: 'clearance_submission', officeId, studentId }
          );
        }

        return {
          success: true,
          message: 'Documents submitted successfully',
          submissionId: String(result.insertedId),
        };
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
      const { clearances, students } = await collections();

      // Get student info
      // Try to find by ObjectId first, or by userId if studentId is numeric
      let student;
      try {
        student = await students.findOne({ _id: new ObjectId(studentId) });
      } catch {
        // If studentId is not a valid ObjectId, try as userId (numeric)
        const numericId = parseInt(studentId, 10);
        if (!isNaN(numericId)) {
          student = await students.findOne({ userId: numericId });
        }
      }

      // Get all submissions for this student
      const submissions = await clearances
        .find({ studentId })
        .toArray();

      // Build status for each office
      const offices = CLEARANCE_OFFICES.map(office => {
        const submission = submissions.find(s => s.officeId === office.id);
        
        return {
          officeId: office.id,
          officeName: office.name,
          stepNumber: office.step,
          status: submission 
            ? submission.status 
            : ('not_started' as const),
          submittedAt: submission?.submittedAt,
          reviewedAt: submission?.reviewedAt,
          comment: submission?.comment,
        };
      });

      // Calculate progress
      const approvedCount = offices.filter(o => o.status === 'approved').length;
      const overallProgress = Math.round((approvedCount / CLEARANCE_OFFICES.length) * 100);
      const isCompleted = approvedCount === CLEARANCE_OFFICES.length;

      return {
        studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : undefined,
        studentMatricNumber: student?.matricNumber,
        offices,
        overallProgress,
        isCompleted,
        canAccessFinalForms: isCompleted,
      };
    } catch (error) {
      console.error('Error getting student status:', error);
      throw error;
    }
  }

  /**
   * Get pending submissions for a specific officer/office
   */
  async getOfficePendingSubmissions(
    officeId: string,
    officerId?: string
  ): Promise<ClearanceSubmission[]> {
    try {
      const { clearances } = await collections();

      const query: any = {
        officeId,
        status: 'pending',
      };

      // If officerId provided, filter by it
      if (officerId) {
        query.officerId = officerId;
      }

      const submissions = await clearances
        .find(query)
        .sort({ submittedAt: 1 })
        .toArray();

      return submissions.map(s => ({
        id: String(s._id),
        studentId: s.studentId,
        studentMatricNumber: s.studentMatricNumber,
        studentName: s.studentName,
        officeId: s.officeId,
        officeName: s.officeName,
        officerId: s.officerId,
        documents: s.documents,
        status: s.status,
        comment: s.comment,
        submittedAt: s.submittedAt,
        reviewedAt: s.reviewedAt,
        reviewedBy: s.reviewedBy,
      }));
    } catch (error) {
      console.error('Error getting pending submissions:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for a specific officer/office (including reviewed)
   */
  async getOfficeAllSubmissions(
    officeId: string,
    officerId?: string
  ): Promise<ClearanceSubmission[]> {
    try {
      const { clearances } = await collections();

      const query: any = { officeId };

      // If officerId provided, filter by it
      if (officerId) {
        query.officerId = officerId;
      }

      const submissions = await clearances
        .find(query)
        .sort({ submittedAt: -1 })
        .toArray();

      return submissions.map(s => ({
        id: String(s._id),
        studentId: s.studentId,
        studentMatricNumber: s.studentMatricNumber,
        studentName: s.studentName,
        officeId: s.officeId,
        officeName: s.officeName,
        officerId: s.officerId,
        documents: s.documents,
        status: s.status,
        comment: s.comment,
        submittedAt: s.submittedAt,
        reviewedAt: s.reviewedAt,
        reviewedBy: s.reviewedBy,
      }));
    } catch (error) {
      console.error('Error getting office submissions:', error);
      throw error;
    }
  }

  /**
   * Approve a clearance submission
   */
  async approveSubmission(
    submissionId: string,
    officerId: string,
    comment?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { clearances, students } = await collections();

      const submission = await clearances.findOne({ _id: new ObjectId(submissionId) });

      if (!submission) {
        return { success: false, message: 'Submission not found' };
      }

      if (submission.status !== 'pending') {
        return { success: false, message: 'Submission already reviewed' };
      }

      // Update submission
      await clearances.updateOne(
        { _id: new ObjectId(submissionId) },
        {
          $set: {
            status: 'approved',
            comment,
            reviewedAt: new Date(),
            reviewedBy: officerId,
            updatedAt: new Date(),
          },
        }
      );

      // Notify student
      await notificationService.createNotification(
        submission.studentId,
        'Clearance Approved',
        `Your clearance for ${submission.officeName} has been approved${comment ? `: ${comment}` : ''}`,
        'success',
        { 
          type: 'clearance_approved', 
          officeId: submission.officeId, 
          officeName: submission.officeName 
        }
      );

      // Check if all clearances are now complete
      const status = await this.getStudentStatus(submission.studentId);
      if (status.isCompleted) {
        await notificationService.createNotification(
          submission.studentId,
          'Clearance Completed!',
          'Congratulations! All clearance offices have approved your submission. You can now download your Final Clearance Form and NYSC Form.',
          'success',
          { type: 'clearance_completed' }
        );
      }

      return {
        success: true,
        message: 'Submission approved successfully',
      };
    } catch (error) {
      console.error('Error approving submission:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve submission',
      };
    }
  }

  /**
   * Reject a clearance submission
   */
  async rejectSubmission(
    submissionId: string,
    officerId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { clearances } = await collections();

      const submission = await clearances.findOne({ _id: new ObjectId(submissionId) });

      if (!submission) {
        return { success: false, message: 'Submission not found' };
      }

      if (submission.status !== 'pending') {
        return { success: false, message: 'Submission already reviewed' };
      }

      // Update submission
      await clearances.updateOne(
        { _id: new ObjectId(submissionId) },
        {
          $set: {
            status: 'rejected',
            comment: reason,
            reviewedAt: new Date(),
            reviewedBy: officerId,
            updatedAt: new Date(),
          },
        }
      );

      // Notify student
      await notificationService.createNotification(
        submission.studentId,
        'Clearance Rejected',
        `Your clearance for ${submission.officeName} has been rejected. Reason: ${reason}. Please review and resubmit.`,
        'error',
        { 
          type: 'clearance_rejected', 
          officeId: submission.officeId, 
          officeName: submission.officeName,
          reason 
        }
      );

      return {
        success: true,
        message: 'Submission rejected',
      };
    } catch (error) {
      console.error('Error rejecting submission:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject submission',
      };
    }
  }

  /**
   * Get a specific submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<ClearanceSubmission | null> {
    try {
      const { clearances } = await collections();

      const submission = await clearances.findOne({ _id: new ObjectId(submissionId) });

      if (!submission) {
        return null;
      }

      return {
        id: String(submission._id),
        studentId: submission.studentId,
        studentMatricNumber: submission.studentMatricNumber,
        studentName: submission.studentName,
        officeId: submission.officeId,
        officeName: submission.officeName,
        officerId: submission.officerId,
        documents: submission.documents,
        status: submission.status,
        comment: submission.comment,
        submittedAt: submission.submittedAt,
        reviewedAt: submission.reviewedAt,
        reviewedBy: submission.reviewedBy,
      };
    } catch (error) {
      console.error('Error getting submission:', error);
      return null;
    }
  }

  /**
   * Check if student can access final clearance forms
   */
  async canAccessFinalForms(studentId: string): Promise<boolean> {
    try {
      const status = await this.getStudentStatus(studentId);
      return status.canAccessFinalForms;
    } catch (error) {
      console.error('Error checking final forms access:', error);
      return false;
    }
  }

  /**
   * Get statistics for an office
   */
  async getOfficeStatistics(officeId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const { clearances } = await collections();

      const total = await clearances.countDocuments({ officeId });
      const pending = await clearances.countDocuments({ officeId, status: 'pending' });
      const approved = await clearances.countDocuments({ officeId, status: 'approved' });
      const rejected = await clearances.countDocuments({ officeId, status: 'rejected' });

      return { total, pending, approved, rejected };
    } catch (error) {
      console.error('Error getting office statistics:', error);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }
}

export const clearanceWorkflow = new ClearanceWorkflowService();
