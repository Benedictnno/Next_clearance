// app/api/officer/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { collections } from '@/lib/mongoCollections';
import { notify } from '@/lib/helpers';
import { applySecurityHeaders, withRateLimit } from '@/lib/security';

const reviewHandler = async (req: NextRequest) => {
  try {
    // Ensure the user is an officer
    const session = await requireRole('OFFICER');
    const data = await req.json();
    
    const { progressId, status, comment } = data;
    
    if (!progressId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid request. Please provide a valid progress ID and status (approved/rejected).' 
      }, { status: 400 });
    }

    // Validate progress ID
    let progressObjectId;
    try {
      progressObjectId = new ObjectId(progressId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid progress ID' }, { status: 400 });
    }

    // Get collections
    const { progress, officers, students } = await collections();
    
    // Get the progress entry
    const progressEntry = await progress.findOne({ _id: progressObjectId });
    if (!progressEntry) {
      return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
    }
    
    // Verify the officer has permission to review this document
    const officer = await officers.findOne({ userId: session.user?.id });
    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }
    
    const { steps } = await collections();
    const step = await steps.findOne({ _id: progressEntry.stepId });
    if (!step) {
      return NextResponse.json({ error: 'Clearance step not found' }, { status: 404 });
    }
    
    // Officer permission check - simplified for now
    // TODO: Implement proper department-based permission checking
    
    // Update the progress status
    const newStatus = status === 'approved' ? 'approved' : 'rejected';
    await progress.updateOne(
      { _id: progressObjectId },
      { 
        $set: { 
          status: newStatus,
          comment: comment || (status === 'approved' ? 'Document approved' : 'Document rejected'),
          reviewedAt: new Date(),
          reviewedBy: session.user?.id
        } 
      }
    );
    
    // Get student info for notification
    const student = await students.findOne({ _id: progressEntry.studentId });
    
    // If approved, check if this was the last step in the current stage and advance to next step
    if (status === 'approved') {
      try {
        // Get the current step
        const { steps: stepsCollection } = await collections();
        const currentStep = await stepsCollection.findOne({ _id: progressEntry.stepId });
        
        if (currentStep) {
          // Check if all documents for this step are approved
          const pendingDocuments = await progress.countDocuments({
            studentId: progressEntry.studentId,
            stepId: progressEntry.stepId,
            status: { $in: ['pending', 'rejected'] }
          });
          
          // If no pending documents, advance to the next step
          if (pendingDocuments === 0) {
            // Find the next step in sequence
            const nextStep = await stepsCollection.findOne({
              stepNumber: currentStep.stepNumber + 1
            });
            
            if (nextStep) {
              // Create progress entry for the next step
              await progress.insertOne({
                studentId: progressEntry.studentId,
                stepId: nextStep._id,
                status: 'pending',
                updatedAt: new Date()
              });
              
              // Notify student about advancing to next step
              if (student) {
                await notify(
                  student.userId.toString(),
                  'Advanced to Next Step',
                  `You have completed ${currentStep.name} and advanced to ${nextStep.name}`,
                  'success'
                );
              }
            } else {
              // This was the final step, mark clearance as complete
              if (student) {
                await notify(
                  student.userId.toString(),
                  'Clearance Completed',
                  'Congratulations! You have completed all clearance steps.',
                  'success'
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Error advancing to next step:', error);
        // Continue with the review process even if advancing fails
      }
    }
    
    // Notify the student about the document review
    if (student) {
      await notify(
        student.userId.toString(),
        `Document ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        status === 'approved' 
          ? 'Your document has been approved.' 
          : `Your document has been rejected. ${comment ? `Reason: ${comment}` : ''}`,
        status === 'approved' ? 'success' : 'error'
      );
    }
    
    const response = NextResponse.json({
      success: true,
      message: `Document has been ${status} successfully`,
      status: status
    });
    return applySecurityHeaders(response);

  } catch (error: any) {
    console.error('Review error:', error);
    const response = NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Review failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
};

// Apply rate limiting (20 reviews per minute)
export const POST = withRateLimit(20, 60000)(reviewHandler);