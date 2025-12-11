
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eksu_clearance';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: MONGODB_URI
        }
    }
});

async function generateOfficerToken() {
    console.log('Finding or creating an HOD officer...');

    // 1. Ensure a Faculty exists
    let faculty = await prisma.faculty.findUnique({ where: { name: 'Science' } });
    if (!faculty) {
        faculty = await prisma.faculty.create({ data: { name: 'Science' } });
        console.log('Created Faculty: Science');
    }

    // 2. Ensure a Department exists
    let department = await prisma.department.findUnique({ where: { name: 'Computer Science' } });
    if (!department) {
        department = await prisma.department.create({
            data: {
                name: 'Computer Science',
                facultyId: faculty.id
            }
        });
        console.log('Created Department: Computer Science');
    }

    // 3. Find or Create the HOD User/Officer
    let user = await prisma.user.findFirst({
        where: {
            role: Role.OFFICER,
            email: 'hod_cs@eksu.edu.ng'
        },
        include: { officer: true }
    });

    if (!user) {
        console.log('No HOD found, creating one...');
        try {
            user = await prisma.user.create({
                data: {
                    email: 'hod_cs@eksu.edu.ng',
                    password: 'password123',
                    role: Role.OFFICER,
                    name: 'Dr. CS HOD',
                    officer: {
                        create: {
                            name: 'Dr. CS HOD',
                            role: 'HOD',
                            assignedOfficeName: 'Head of Department (Computer Science)',
                            // Legacy
                            assignedOfficeId: 'department_hod',
                            // New System
                            assignedOffices: ['department_hod'],
                            assignedDepartmentId: department.id,
                            department: {
                                connect: { id: department.id }
                            }
                        }
                    }
                },
                include: { officer: true }
            });
        } catch (e) {
            console.error("Error creating officer:", e);
            return;
        }
    }

    if (!user) {
        console.error("Failed to retrieve or create user.");
        return;
    }

    // 4. Ensure the Officer is linked as HOD to the Department and has correct IDs
    if (user.officer) {
        // Force update office IDs to current standard
        await prisma.officer.update({
            where: { id: user.officer.id },
            data: {
                assignedOfficeId: 'department_hod',
                assignedOfficeName: `Head of Department (${department.name})`,
                assignedOffices: ['department_hod'],
                assignedDepartmentId: department.id,
                assignedDepartmentName: department.name,
                department: { connect: { id: department.id } }
            }
        });
        console.log(`Updated Officer ${user.officer.name} with correct office IDs`);

        // Check if department has this officer as HOD
        if (department.hodOfficerId !== user.officer.id) {
            await prisma.department.update({
                where: { id: department.id },
                data: { hodOfficerId: user.officer.id }
            });
            console.log(`Linked Officer ${user.officer.name} as HOD of ${department.name}`);
        }

        // Refresh user to get updated officer data for token
        user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { officer: true }
        });
    } else {
        console.error("User created but no officer profile found.");
        return;
    }

    if (!user || !user.officer) return;

    console.log(`Found Officer: ${user.email} (${user.id})`);

    // Generate Token
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        officerId: user.officer.id,
        name: user.name,
        assignedOfficeId: user.officer.assignedOfficeId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    console.log('\n==========================================');
    console.log('GENERATED OFFICER TOKEN:');
    console.log('==========================================\n');
    console.log(token);
    console.log('\n==========================================');
    console.log('Use this token in the "auth_token" cookie or Authorization header.');
}

generateOfficerToken()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
