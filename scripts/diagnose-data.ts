import { prisma } from '../lib/prisma';

async function diagnose() {
    console.log('--- DATABASE DIAGNOSIS ---');

    try {
        const students = await prisma.student.findMany({
            where: { firstName: 'Akorede', lastName: 'Salaudeen' },
            include: { department: true, faculty: true }
        });
        console.log('Students Named Akorede Salaudeen:', JSON.stringify(students, null, 2));

        const depts = await prisma.department.findMany({
            where: { name: 'Computer Science' },
            include: { faculty: true, hodOfficer: true }
        });
        console.log('Computer Science Departments:', JSON.stringify(depts, null, 2));

        const faculties = await prisma.faculty.findMany({
            where: { name: 'Physical Science' },
            include: { facultyOfficer: true, departments: true }
        });
        console.log('Physical Science Faculties:', JSON.stringify(faculties, null, 2));

        const users = await prisma.user.findMany({
            where: { email: 'off2024001@gmail.com' },
            include: { officer: true }
        });
        console.log('Users with email off2024001@gmail.com:', JSON.stringify(users, null, 2));

        const payloadUser = await prisma.user.findUnique({
            where: { id: '699de64f8be117bbf3c60800' },
            include: { officer: true }
        });
        console.log('User with ID 699de64f8be117bbf3c60800:', JSON.stringify(payloadUser, null, 2));

        const allOfficers = await prisma.officer.findMany({
            where: { name: { contains: 'Adebayo Segun', mode: 'insensitive' } },
            include: { user: true }
        });
        console.log('All matching Officers and their Users:', JSON.stringify(allOfficers, null, 2));

        const allFaculties = await prisma.faculty.findMany({
            select: { id: true, name: true, facultyOfficerId: true }
        });
        console.log('All Faculties:', allFaculties);

    } catch (error) {
        console.error('Diagnosis Failed:', error);
    } finally {
        process.exit(0);
    }
}

diagnose();
