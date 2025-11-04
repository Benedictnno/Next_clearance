import { collections } from '@/lib/mongoCollections';
import { ObjectId } from 'mongodb';
import { notificationService } from '@/lib/notificationService';

export interface ClearanceStep {
  stepNumber: number;
  officeName: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  actionedAt?: Date;
  officer?: {
    name: string;
    department?: { name: string };
  };
}

export interface StudentProgress {
  studentId: string;
  progressPercentage: number;
  isCompleted: boolean;
  steps: Array<{
    step: {
      id: string;
      stepNumber: number;
      name: string;
      requiresPayment: boolean;
      paymentAmount?: number;
    };
    progress: {
      status: 'pending' | 'approved' | 'rejected';
      comment?: string;
      updatedAt: Date;
    };
  }>;
}

export interface OfficerActionResult {
  success: boolean;
  message: string;
  nextStep?: number;
  isCompleted?: boolean;
  notifications?: string[];
}

class ClearanceEngine {
  /**
   * Get student's clearance progress
   */
  async getStudentProgress(studentId: string): Promise<StudentProgress> {
    try {
      const { students, steps, progress } = await collections();
      
      // Get student info
      const student = await students.findOne({ 
        $or: [
          { _id: new ObjectId(studentId) },
          { userId: studentId }
        ]
      });
      
      if (!student) {
        throw new Error('Student not found');
      }

      // Get all clearance steps
      const clearanceSteps = await steps.find({}).sort({ stepNumber: 1 }).toArray();
      
      // Get student's progress for each step
      const progressEntries = await progress.find({
        studentId: String(student._id)
      }).toArray();

      const stepsWithProgress = clearanceSteps.map(step => {
        const progress = progressEntries.find(p => 
          p.stepId.toString() === step._id.toString()
        );
        
        return {
          step: {
            id: String(step._id),
            stepNumber: step.stepNumber,
            name: step.name,
            requiresPayment: step.requiresPayment || false,
            paymentAmount: step.paymentAmount || undefined
          },
          progress: {
            status: progress?.status || 'pending',
            comment: progress?.comment || undefined,
            updatedAt: progress?.updatedAt || new Date()
          }
        };
      });

      const approvedSteps = stepsWithProgress.filter(s => s.progress.status === 'approved').length;
      const progressPercentage = Math.round((approvedSteps / clearanceSteps.length) * 100);
      const isCompleted = approvedSteps === clearanceSteps.length;

      return {
        studentId: String(student._id),
        progressPercentage,
        isCompleted,
        steps: stepsWithProgress
      };
    } catch (error) {
      console.error('Error getting student progress:', error);
      throw error;
    }
  }

  /**
   * Check if student's clearance is completed
   */
  async isClearanceCompleted(studentId: string): Promise<boolean> {
    try {
      const progress = await this.getStudentProgress(studentId);
      return progress.isCompleted;
    } catch (error) {
      console.error('Error checking clearance completion:', error);
      return false;
    }
  }

  /**
   * Process officer action (approve/reject)
   */
  async processOfficerAction(
    studentId: string,
    stepId: string,
    action: 'approve' | 'reject',
    officerId: string,
    comment?: string
  ): Promise<OfficerActionResult> {
    try {
      const { progress, steps, students, officers } = await collections();
      
      // Validate inputs
      if (!['approve', 'reject'].includes(action)) {
        return { success: false, message: 'Invalid action. Must be approve or reject.' };
      }

      // Get student
      const student = await students.findOne({ 
        $or: [
          { _id: new ObjectId(studentId) },
          { userId: studentId }
        ]
      });
      
      if (!student) {
        return { success: false, message: 'Student not found' };
      }

      // Get step
      const step = await steps.findOne({ _id: new ObjectId(stepId) });
      if (!step) {
        return { success: false, message: 'Clearance step not found' };
      }

      // Get officer
      const officer = await officers.findOne({ 
        $or: [
          { _id: new ObjectId(officerId) },
          { userId: officerId }
        ]
      });
      
      if (!officer) {
        return { success: false, message: 'Officer not found' };
      }

      // Update or create progress entry
      const progressUpdate = {
        studentId: String(student._id),
        stepId: new ObjectId(stepId),
        stepNumber: step.stepNumber,
        status: (action === 'approve' ? 'approved' : 'rejected') as 'approved' | 'rejected',
        comment: comment || '',
        officerId: String(officer._id),
        officerName: officer.name,
        actionedAt: new Date(),
        updatedAt: new Date()
      };

      await progress.updateOne(
        { 
          studentId: String(student._id),
          stepId: new ObjectId(stepId)
        },
        { $set: progressUpdate },
        { upsert: true }
      );

      // Check if clearance is now completed
      const updatedProgress = await this.getStudentProgress(String(student._id));
      const isCompleted = updatedProgress.isCompleted;
      
      // Determine next step
      let nextStep: number | undefined;
      if (action === 'approve' && !isCompleted) {
        const nextStepEntry = updatedProgress.steps.find(s => s.progress.status === 'pending');
        nextStep = nextStepEntry?.step.stepNumber;
      }

      // Send notifications
      const notifications: string[] = [];
      
      if (action === 'approve') {
        if (isCompleted) {
          // Notify student of completion
          const notificationId = await notificationService.notifyClearanceCompleted(student.userId);
          notifications.push(notificationId);
        } else {
          // Notify student of step approval
          const notificationId = await notificationService.notifyClearanceStepApproved(
            student.userId,
            step.name,
            step.stepNumber,
            false
          );
          notifications.push(notificationId);
        }
      } else {
        // Notify student of rejection
        const notificationId = await notificationService.createNotification(
          student.userId,
          'Step Rejected',
          `Your submission for step ${step.stepNumber}: ${step.name} has been rejected. ${comment ? `Reason: ${comment}` : 'Please review and resubmit.'}`,
          'error',
          { stepName: step.name, stepNumber: step.stepNumber, type: 'clearance_rejection' }
        );
        notifications.push(notificationId);
      }

      return {
        success: true,
        message: action === 'approve' 
          ? (isCompleted ? 'Step approved. Clearance completed!' : 'Step approved successfully')
          : 'Step rejected',
        nextStep,
        isCompleted,
        notifications
      };

    } catch (error) {
      console.error('Error processing officer action:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process action' 
      };
    }
  }

  /**
   * Initiate clearance process for a student
   */
  async initiateClearance(studentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { students, steps, progress } = await collections();
      
      // Get student
      const student = await students.findOne({ 
        $or: [
          { _id: new ObjectId(studentId) },
          { userId: studentId }
        ]
      });
      
      if (!student) {
        return { success: false, message: 'Student not found' };
      }

      // Check if already initiated
      const existingProgress = await progress.findOne({
        studentId: String(student._id)
      });
      
      if (existingProgress) {
        return { success: false, message: 'Clearance already initiated for this student' };
      }

      // Get all clearance steps
      const clearanceSteps = await steps.find({}).sort({ stepNumber: 1 }).toArray();
      
      if (clearanceSteps.length === 0) {
        return { success: false, message: 'No clearance steps configured' };
      }

      // Create initial progress entries for all steps
      const progressEntries = clearanceSteps.map(step => ({
        studentId: String(student._id),
        stepId: step._id,
        stepNumber: step.stepNumber,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await progress.insertMany(progressEntries);

      // Notify student
      await notificationService.createNotification(
        student.userId,
        'Clearance Process Started',
        'Your clearance process has been initiated. Please begin with step 1.',
        'info',
        { type: 'clearance_initiation' }
      );

      return { success: true, message: 'Clearance process initiated successfully' };

    } catch (error) {
      console.error('Error initiating clearance:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to initiate clearance' 
      };
    }
  }
}

export const clearanceEngine = new ClearanceEngine();