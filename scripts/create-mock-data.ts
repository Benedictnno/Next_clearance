/**
 * Mock Data Generator - No Database Required
 * Creates JSON files with clearance steps data for testing
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const clearanceSteps = [
  {
    id: "step_1",
    stepNumber: 1,
    name: 'Payments (NCR, Clearance Slip, Advancement & Linkages, Sports, NYSC)',
    description: 'Submit payment receipts for all required fees',
    isDepartmentSpecific: false,
    requiresPayment: true,
    paymentAmount: 25000,
    requiresReceipt: true,
    receiptDescription: 'Payment receipt for clearance fee',
    supportingDocsDescription: 'Upload all payment receipts',
    requiredDocuments: ['RECEIPT']
  },
  {
    id: "step_2",
    stepNumber: 2,
    name: 'Examinations & Records (Collect Clearance Slip)',
    description: 'Collect your clearance slip from examinations office',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: true,
    receiptDescription: 'Examinations office clearance slip',
    supportingDocsDescription: 'Upload signed clearance slip from examinations office',
    requiredDocuments: ['CLEARANCE_FORM']
  },
  {
    id: "step_3",
    stepNumber: 3,
    name: 'Head of Department',
    description: 'Get clearance approval from your department HOD',
    isDepartmentSpecific: true,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload any additional documents required by your department',
    requiredDocuments: ['OTHER']
  },
  {
    id: "step_4",
    stepNumber: 4,
    name: 'Faculty Officer',
    description: 'Get faculty-level clearance approval',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload faculty clearance documents if required',
    requiredDocuments: ['OTHER']
  },
  {
    id: "step_5",
    stepNumber: 5,
    name: 'Faculty Library',
    description: 'Clear any outstanding library obligations',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload library clearance certificate',
    requiredDocuments: ['CLEARANCE_FORM']
  },
  {
    id: "step_6",
    stepNumber: 6,
    name: 'Main Library',
    description: 'Final library clearance from main university library',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload main library clearance form',
    requiredDocuments: ['CLEARANCE_FORM']
  },
  {
    id: "step_7",
    stepNumber: 7,
    name: 'Sports Directorate',
    description: 'Sports department clearance',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: true,
    receiptDescription: 'Sports fee payment receipt',
    supportingDocsDescription: 'Upload sports clearance certificate',
    requiredDocuments: ['RECEIPT', 'CLEARANCE_FORM']
  },
  {
    id: "step_8",
    stepNumber: 8,
    name: 'Alumni Office (Teller/Remita)',
    description: 'Alumni office clearance with payment proof',
    isDepartmentSpecific: false,
    requiresPayment: true,
    paymentAmount: 5000,
    requiresReceipt: true,
    receiptDescription: 'Alumni office payment receipt (Teller/Remita)',
    supportingDocsDescription: 'Upload alumni clearance documents',
    requiredDocuments: ['RECEIPT', 'OTHER']
  }
];

// Mock student clearance data
const mockClearanceData = {
  request: {
    id: "req_123",
    status: 'IN_PROGRESS' as const,
    currentStep: 5
  },
  steps: clearanceSteps.map((step, index) => ({
    step,
    progress: {
      id: `progress_${step.id}`,
      status: index < 4 ? 'APPROVED' as const : 
              index === 4 ? 'PENDING' as const : 'PENDING' as const,
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
  progressPercentage: 50,
  isCompleted: false
};

async function createMockData() {
  console.log('📂 Creating mock data files...');
  
  try {
    // Create data directory
    const dataDir = path.join(process.cwd(), 'data');
    await mkdir(dataDir, { recursive: true });
    
    // Write clearance steps
    await writeFile(
      path.join(dataDir, 'clearance-steps.json'),
      JSON.stringify(clearanceSteps, null, 2)
    );
    console.log('✅ Created clearance-steps.json');
    
    // Write mock clearance data
    await writeFile(
      path.join(dataDir, 'mock-clearance-data.json'),
      JSON.stringify(mockClearanceData, null, 2)
    );
    console.log('✅ Created mock-clearance-data.json');
    
    console.log('🎉 Mock data created successfully!');
    console.log('💡 You can now test the frontend without a database connection');
    console.log('📍 Files created in: ./data/');
    
  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createMockData()
    .then(() => {
      console.log('🏁 Mock data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Mock data creation failed:', error);
      process.exit(1);
    });
}

export default createMockData;
