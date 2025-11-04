// File: scripts/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Create Faculty
  const faculty = await prisma.faculty.upsert({
    where: { name: 'Faculty of Science' },
    update: {},
    create: { name: 'Faculty of Science' },
  });
  console.log('✓ Created Faculty:', faculty.name);

  // Create Department
  const department = await prisma.department.upsert({
    where: { name: 'Computer Science' },
    update: {},
    create: {
      name: 'Computer Science',
      description: 'Department of Computer Science',
      facultyId: faculty.id,
    },
  });
  console.log('✓ Created Department:', department.name);

  // Create HOD User
  const hodUser = await prisma.user.upsert({
    where: { email: 'hod@university.edu' },
    update: {},
    create: {
      email: 'hod@university.edu',
      name: 'Dr. John Smith',
      role: 'OFFICER',
    },
  });
  console.log('✓ Created HOD User:', hodUser.email);

  // Create HOD Officer
  const hodOfficer = await prisma.officer.upsert({
    where: { userId: hodUser.id },
    update: {},
    create: {
      userId: hodUser.id,
      name: 'Dr. John Smith',
      departmentId: department.id,
      role: 'HOD',
    },
  });
  console.log('✓ Created HOD Officer:', hodOfficer.name);

  // Assign HOD to Department
  await prisma.department.update({
    where: { id: department.id },
    data: { hodOfficerId: hodOfficer.id },
  });
  console.log('✓ Assigned HOD to Department');

  // Create other officers
  const officers = [
    { email: 'faculty@university.edu', name: 'Faculty Officer', role: 'FACULTY_OFFICER', step: 2 },
    { email: 'library@university.edu', name: 'Library Officer', role: 'LIBRARY', step: 3 },
    { email: 'bursary@university.edu', name: 'Bursary Officer', role: 'BURSARY', step: 4 },
    { email: 'affairs@university.edu', name: 'Student Affairs Officer', role: 'STUDENT_AFFAIRS', step: 5 },
    { email: 'security@university.edu', name: 'Security Officer', role: 'SECURITY', step: 6 },
    { email: 'registry@university.edu', name: 'Registry Officer', role: 'REGISTRY', step: 7 },
  ];

  for (const off of officers) {
    const user = await prisma.user.upsert({
      where: { email: off.email },
      update: {},
      create: {
        email: off.email,
        name: off.name,
        role: 'OFFICER',
      },
    });

    const officer = await prisma.officer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: off.name,
        role: off.role,
      },
    });

    await prisma.clearanceStep.update({
      where: { stepNumber: off.step },
      data: { assignedOfficerId: officer.id },
    });

    console.log(`✓ Created Officer: ${off.name} (Step ${off.step})`);
  }

  // Create Student User
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      email: 'student@university.edu',
      name: 'Jane Doe',
      role: 'STUDENT',
    },
  });
  console.log('✓ Created Student User:', studentUser.email);

  // Create Student
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      matricNumber: 'CS/2020/001',
      firstName: 'Jane',
      lastName: 'Doe',
      departmentId: department.id,
      facultyId: faculty.id,
      level: '400',
      gender: 'Female',
    },
  });
  console.log('✓ Created Student: Jane Doe (CS/2020/001)');

  console.log('\n✅ Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });