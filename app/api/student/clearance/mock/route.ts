import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read mock clearance steps data
    const stepsPath = path.join(process.cwd(), 'data', 'clearance-steps.json');
    const stepsData = await readFile(stepsPath, 'utf-8');
    const clearanceSteps = JSON.parse(stepsData);

    // Create mock clearance progress
    const mockClearanceData = {
      request: {
        id: "mock_req_123",
        status: 'IN_PROGRESS',
        currentStep: 5
      },
      steps: clearanceSteps.map((step: any, index: number) => ({
        step,
        progress: {
          id: `progress_${step.id}`,
          status: index < 4 ? 'APPROVED' : 
                  index === 4 ? 'PENDING' : 'PENDING',
          comment: index === 1 ? 'Please ensure all documents are properly signed' : undefined,
          actionedAt: index < 4 ? new Date().toISOString() : undefined,
          documents: index < 2 ? [
            {
              id: `doc_${step.id}_1`,
              name: `${step.name.substring(0, 20)}_receipt.pdf`,
              type: 'RECEIPT',
              url: `/uploads/mock_${step.id}_receipt.pdf`
            }
          ] : []
        }
      })),
      progressPercentage: Math.round((4 / clearanceSteps.length) * 100),
      isCompleted: false
    };

    return NextResponse.json(mockClearanceData);
    
  } catch (error) {
    console.error('Error loading mock data:', error);
    
    // Fallback hardcoded data if file doesn't exist
    const fallbackData = {
      request: {
        id: "mock_req_123",
        status: 'PENDING',
        currentStep: 1
      },
      steps: [
        {
          step: {
            id: "step_1",
            stepNumber: 1,
            name: "Payments (NCR, Clearance Slip, Advancement & Linkages, Sports, NYSC)",
            description: "Submit payment receipts for all required fees",
            requiresPayment: true,
            paymentAmount: 25000,
            requiresReceipt: true,
            receiptDescription: "Payment receipt for clearance fee",
            supportingDocsDescription: "Upload all payment receipts"
          },
          progress: {
            id: "progress_1",
            status: 'PENDING',
            documents: []
          }
        }
      ],
      progressPercentage: 0,
      isCompleted: false
    };

    return NextResponse.json(fallbackData);
  }
}
