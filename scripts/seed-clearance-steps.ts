import prisma from '../lib/prisma';

const clearanceSteps = [
  {
    stepNumber: 1,
    name: 'Head of Department (HOD)',
    description: 'Get clearance approval from your department HOD',
    isDepartmentSpecific: true,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload any additional documents required by your department'
  },
  {
    stepNumber: 2,
    name: 'Faculty Officer',
    description: 'Get faculty-level clearance approval',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload faculty clearance documents if required'
  },
  {
    stepNumber: 3,
    name: 'University Librarian',
    description: 'Clear any outstanding library obligations',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload library clearance certificate'
  },
  {
    stepNumber: 4,
    name: 'Exams and Transcript Office',
    description: 'Collect your clearance slip from examinations office',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: true,
    receiptDescription: 'Examinations office clearance slip',
    supportingDocsDescription: 'Upload signed clearance slip from examinations office'
  },
  {
    stepNumber: 5,
    name: 'Bursary',
    description: 'Submit payment receipts for all required fees',
    isDepartmentSpecific: false,
    requiresPayment: true,
    paymentAmount: 25000,
    requiresReceipt: true,
    receiptDescription: 'Payment receipt for clearance fee',
    supportingDocsDescription: 'Upload all payment receipts'
  },
  {
    stepNumber: 6,
    name: 'Sports Council',
    description: 'Sports department clearance',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: true,
    receiptDescription: 'Sports fee payment receipt',
    supportingDocsDescription: 'Upload sports clearance certificate'
  },
  {
    stepNumber: 7,
    name: 'Alumni Association',
    description: 'Alumni office clearance with payment proof',
    isDepartmentSpecific: false,
    requiresPayment: true,
    paymentAmount: 5000,
    requiresReceipt: true,
    receiptDescription: 'Alumni office payment receipt (Teller/Remita)',
    supportingDocsDescription: 'Upload alumni clearance documents'
  },
  {
    stepNumber: 8,
    name: 'Internal Audit',
    description: 'Internal audit verification',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload internal audit clearance form'
  },
  {
    stepNumber: 9,
    name: 'Office of Advancement and Linkages',
    description: 'Advancement and linkages clearance',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload advancement and linkages documents'
  },
  {
    stepNumber: 10,
    name: 'Security Office',
    description: 'Security unit clearance',
    isDepartmentSpecific: false,
    requiresPayment: false,
    requiresReceipt: false,
    supportingDocsDescription: 'Upload security clearance documents'
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
