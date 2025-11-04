// File: scripts/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up clearance system...\n');

  const steps = [
    {
      stepNumber: 1,
      name: 'Head of Department (HOD)',
      description: 'HOD approval from your department',
      isDepartmentSpecific: true,
      requiresPayment: false,
    },
    {
      stepNumber: 2,
      name: 'Faculty Officer',
      description: 'Faculty-level clearance',
      isDepartmentSpecific: false,
      requiresPayment: false,
    },
    {
      stepNumber: 3,
      name: 'Library',
      description: 'Library clearance - ensure no outstanding books',
      isDepartmentSpecific: false,
      requiresPayment: false,
    },
    {
      stepNumber: 4,
      name: 'Bursary',
      description: 'Financial clearance - ensure all fees are paid',
      isDepartmentSpecific: false,
      requiresPayment: false,
    },
    {
      stepNumber: 5,
      name: 'Student Affairs',
      description: 'Student affairs clearance',
      isDepartmentSpecific: false,
      requiresPayment: false,
    },
    {
      stepNumber: 6,
      name: 'Security Unit',
      description: 'Security clearance',
      isDepartmentSpecific: false,
      requiresPayment: false,
    },
    {
      stepNumber: 7,
      name: 'Registry',
      description: 'Final registry clearance',
      isDepartmentSpecific: false,
      requiresPayment: false,
    },
  ];

  for (const step of steps) {
    // Find existing step by stepNumber
    const existingStep = await prisma.clearanceStep.findFirst({
      where: { stepNumber: step.stepNumber },
    });

    if (existingStep) {
      // Update existing step
      await prisma.clearanceStep.update({
        where: { id: existingStep.id },
        data: step,
      });
    } else {
      // Create new step
      await prisma.clearanceStep.create({
        data: step,
      });
    }
    console.log(`✓ Step ${step.stepNumber}: ${step.name}`);
  }

  console.log('\n✅ Setup completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });