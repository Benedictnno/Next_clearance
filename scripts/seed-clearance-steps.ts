import prisma from '../lib/prisma';

const clearanceSteps = [
  {
    stepNumber: 1,
    name: 'Payments (NCR, Clearance Slip, Advancement & Linkages, Sports, NYSC)',
    description: 'Submit payment receipts for all required fees',
    isDepartmentSpecific: false,
    requiresPayment: true,
    paymentAmount: 25000,
    requiresReceipt: true,
    receiptDescription: 'Payment receipt for clearance fee',
    supportingDocsDescription: 'Upload all payment receipts'
  },
  {
    stepNumber: 2,
    name: 'Examinations & Records (Collect Clearance Slip)',
    description: 'Collect your clearance slip from examinations office',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: true,
    receiptDescription: 'Examinations office clearance slip',
    supportingDocsDescription: 'Upload signed clearance slip from examinations office'
  },
  {
    stepNumber: 3,
    name: 'Head of Department',
    description: 'Get clearance approval from your department HOD',
    isDepartmentSpecific: true,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload any additional documents required by your department'
  },
  {
    stepNumber: 4,
    name: 'Faculty Officer',
    description: 'Get faculty-level clearance approval',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload faculty clearance documents if required'
  },
  {
    stepNumber: 5,
    name: 'Faculty Library',
    description: 'Clear any outstanding library obligations',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload library clearance certificate'
  },
  {
    stepNumber: 6,
    name: 'Main Library',
    description: 'Final library clearance from main university library',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload main library clearance form'
  },
  {
    stepNumber: 7,
    name: 'Sports Directorate',
    description: 'Sports department clearance',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: true,
    receiptDescription: 'Sports fee payment receipt',
    supportingDocsDescription: 'Upload sports clearance certificate'
  },
  {
    stepNumber: 8,
    name: 'Alumni Office (Teller/Remita)',
    description: 'Alumni office clearance with payment proof',
    isDepartmentSpecific: false,
    requiresPayment: true,
    paymentAmount: 5000,
    requiresReceipt: true,
    receiptDescription: 'Alumni office payment receipt (Teller/Remita)',
    supportingDocsDescription: 'Upload alumni clearance documents'
  }
];

async function seedClearanceSteps() {
  console.log('🌱 Seeding clearance steps...');
  
  try {
    // Clear existing steps
    await prisma.clearanceStep.deleteMany({});
    console.log('✅ Cleared existing clearance steps');

    // Create new steps
    for (const step of clearanceSteps) {
      await prisma.clearanceStep.create({
        data: {
          ...step,
          requiredDocuments: step.requiresReceipt ? ['RECEIPT'] : ['OTHER']
        }
      });
      console.log(`✅ Created step ${step.stepNumber}: ${step.name}`);
    }

    console.log('🎉 Clearance steps seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding clearance steps:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedClearanceSteps()
    .then(() => {
      console.log('🏁 Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedClearanceSteps;
