
import { prisma } from '../lib/prisma';
import { clearanceWorkflow } from '../lib/clearanceWorkflow';

async function main() {
    console.log('--- STARTING CLEARANCE FLOW TEST ---');

    console.log('1. Setting up Test Data...');
    // Ensure Faculty/Dept exists (re-using logic or relying on seeds)
    const faculty = await prisma.faculty.upsert({
        where: { name: 'Test Faculty' },
        update: {},
        create: { name: 'Test Faculty' }
    });
    const department = await prisma.department.upsert({
        where: { name: 'Test Dept' },
        update: {},
        create: { name: 'Test Dept', facultyId: faculty.id }
    });

    // Create Student
    const studentUser = await prisma.user.upsert({
        where: { email: 'test_student_flow@eksu.edu.ng' },
        update: {},
        create: {
            email: 'test_student_flow@eksu.edu.ng',
            role: 'STUDENT',
            student: {
                create: {
                    matricNumber: 'TEST/FLOW/001',
                    departmentId: department.id
                }
            }
        },
        include: { student: true }
    });

    const student = studentUser.student!;
    console.log(`Student Created: ${student.id} (Dept: ${department.name})`);

    // Reset any existing clearance
    await prisma.clearanceRequest.deleteMany({ where: { studentId: student.id } });
    await prisma.clearanceProgress.deleteMany({ where: { request: { studentId: student.id } } });


    console.log('\n2. Attempting to submit to Library (Tier 2) BEFORE HOD...');
    const result1 = await clearanceWorkflow.submitToOffice(
        student.id,
        'Test Student',
        'TEST/FLOW/001',
        'university_librarian', // Library
        [{ fileName: 'test.pdf', fileUrl: 'http://test', fileType: 'application/pdf' }]
    );

    if (result1.success) {
        console.error('❌ FAILED: Library submission succeeded but should be locked!');
        process.exit(1);
    } else {
        console.log('✅ SUCCESS: Library submission locked as expected.');
        console.log(`   Message: ${result1.message}`);
    }


    console.log('\n3. Submitting to HOD (Tier 1)...');
    const result2 = await clearanceWorkflow.submitToOffice(
        student.id,
        'Test Student',
        'TEST/FLOW/001',
        'department_hod',
        [{ fileName: 'hod_form.pdf', fileUrl: 'http://test', fileType: 'application/pdf' }]
    );

    if (!result2.success) {
        console.error(`❌ FAILED: HOD submission failed: ${result2.message}`);
        process.exit(1);
    }
    console.log('✅ SUCCESS: HOD submission accepted.');
    const hodSubmissionId = result2.submissionId!;


    console.log('\n4. Approving HOD Submission...');
    // Create an Officer
    const officerUser = await prisma.user.upsert({
        where: { email: 'test_officer_flow@eksu.edu.ng' },
        update: {},
        create: {
            email: 'test_officer_flow@eksu.edu.ng',
            role: 'OFFICER',
            officer: {
                create: {
                    name: 'Test HOD',
                    assignedDepartmentId: department.id,
                    departmentId: department.id,
                    assignedOffices: ['department_hod']
                }
            }
        },
        include: { officer: true }
    });

    await clearanceWorkflow.approveSubmission(hodSubmissionId, officerUser.officer!.id, 'Approved by Test Script');
    console.log('✅ HOD Approved.');


    console.log('\n5. Attempting to submit to Library (Tier 2) AFTER HOD...');
    const result3 = await clearanceWorkflow.submitToOffice(
        student.id,
        'Test Student',
        'TEST/FLOW/001',
        'university_librarian', // Library
        [{ fileName: 'lib_form.pdf', fileUrl: 'http://test', fileType: 'application/pdf' }]
    );

    if (!result3.success) {
        console.error(`❌ FAILED: Library submission failed but should be allowed: ${result3.message}`);
        process.exit(1);
    }
    console.log('✅ SUCCESS: Library submission accepted.');


    console.log('\n--- VERIFICATION COMPLETE ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
