/**
 * Document Review Module
 * 
 * Handles document review functionality for officers
 */

import prisma from './prisma';

/**
 * Reviews a document (approve or reject)
 */
export async function reviewDocument(
  documentId: string,
  status: 'approved' | 'rejected',
  comment: string = ''
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Update document status
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        reviewComment: comment,
        reviewedAt: new Date()
      },
      include: { student: true }
    });
    
    // Update clearance progress
    await prisma.clearanceProgress.updateMany({
      where: {
        studentId: document.studentId,
        documentUrl: document.fileUrl
      },
      data: {
        status: status === 'approved' ? 'completed' : 'rejected',
        comment: comment || (status === 'approved' ? 'Document approved' : 'Document rejected')
      }
    });
    
    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: document.studentId,
        title: `Document ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: status === 'approved' 
          ? `Your ${document.documentType} has been approved` 
          : `Your ${document.documentType} has been rejected. Reason: ${comment || 'No reason provided'}`,
        link: `/student/dashboard`,
        read: false
      }
    });
    
    return { 
      success: true, 
      message: `Document has been ${status} successfully` 
    };
  } catch (error) {
    console.error(`Error reviewing document:`, error);
    return { success: false, error: 'Failed to review document' };
  }
}

/**
 * Gets all pending documents for an officer
 */
export async function getOfficerPendingDocuments(officerId: string) {
  try {
    // Get departments managed by this officer
    const departments = await prisma.department.findMany({
      where: { officerId }
    });
    
    const departmentIds = departments.map(dept => dept.id);
    
    // Get steps associated with these departments
    const steps = await prisma.clearanceStep.findMany({
      where: { departmentId: { in: departmentIds } }
    });
    
    const stepIds = steps.map(step => step.id);
    
    // Get clearance progress entries for these steps that are in review
    const progressEntries = await prisma.clearanceProgress.findMany({
      where: { 
        stepId: { in: stepIds },
        status: 'in_review'
      },
      include: { student: true }
    });
    
    // Get document details
    const documents = [];
    for (const entry of progressEntries) {
      if (entry.documentUrl) {
        const document = await prisma.document.findFirst({
          where: { fileUrl: entry.documentUrl },
          include: { student: true }
        });
        
        if (document) {
          documents.push({
            ...document,
            studentName: entry.student?.name || 'Unknown Student',
            stepId: entry.stepId
          });
        }
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error getting officer pending documents:', error);
    throw error;
  }
}