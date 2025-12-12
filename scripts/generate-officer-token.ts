
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import * as readline from 'readline';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eksu_clearance';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: MONGODB_URI
        }
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

// Role configurations
const ROLE_CONFIGS: Record<string, { offices: string[], needsDepartment?: boolean, needsFaculty?: boolean }> = {
    'HOD': { offices: ['hod'], needsDepartment: true },
    'FACULTY_OFFICER': { offices: ['faculty'], needsFaculty: true }, // Mapped to 'faculty' office
    'DEAN': { offices: ['dean'], needsFaculty: true },
    'LIBRARY': { offices: ['library'] },
    'BURSAR': { offices: ['bursar'] },
    'SPORTS': { offices: ['sports'] },
    'CLINIC': { offices: ['clinic'] },
    'REGISTRAR': { offices: ['registrar'] },
    'STUDENT_AFFAIRS': { offices: ['student_affairs'] },
};

async function generateOfficerToken() {
    console.log('\n=== OFFICER TOKEN GENERATOR ===\n');

    // 1. Select Role
    console.log('Available Roles:');
    Object.keys(ROLE_CONFIGS).forEach((r, i) => console.log(`${i + 1}. ${r}`));

    const roleIndexStr = await askQuestion('\nSelect Role (number) [Default: 1 - HOD]: ');
    const roleIndex = roleIndexStr ? parseInt(roleIndexStr) - 1 : 0;
    const roleKey = Object.keys(ROLE_CONFIGS)[roleIndex];

    if (!roleKey) {
        console.error('Invalid selection.');
        process.exit(1);
    }

    const config = ROLE_CONFIGS[roleKey];
    console.log(`\nSelected Role: ${roleKey}`);

    let departmentName = '';
    let facultyName = '';
    let department = null;
    let faculty = null;

    // 2. Get Context (Department/Faculty)
    if (config.needsFaculty) {
        facultyName = await askQuestion('Enter Faculty Name [Default: Science]: ') || 'Science';
    }

    if (config.needsDepartment) {
        departmentName = await askQuestion('Enter Department Name [Default: Computer Science]: ') || 'Computer Science';
        // Infer faculty for department if not already asked
        if (!facultyName) {
            facultyName = await askQuestion('Enter Faculty for this Department [Default: Science]: ') || 'Science';
        }
    }

    // 3. Ensure Hierarchy Exists
    if (facultyName) {
        let fac = await prisma.faculty.findUnique({ where: { name: facultyName } });
        if (!fac) {
            fac = await prisma.faculty.create({ data: { name: facultyName } });
            console.log(`Created Faculty: ${facultyName}`);
        }
        faculty = fac;
    }

    if (departmentName && faculty) {
        let dept = await prisma.department.findUnique({ where: { name: departmentName } });
        if (!dept) {
            dept = await prisma.department.create({
                data: {
                    name: departmentName,
                    facultyId: faculty.id
                }
            });
            console.log(`Created Department: ${departmentName}`);
        }
        department = dept;
    }

    // 4. Create/Find User
    // Use a deterministic email based on role/context
    const emailPrefix = roleKey.toLowerCase();
    const contextSuffix = departmentName ? `_${departmentName.replace(/\s+/g, '_').toLowerCase()}` :
        facultyName ? `_${facultyName.replace(/\s+/g, '_').toLowerCase()}` : '';
    const email = `${emailPrefix}${contextSuffix}@eksu.edu.ng`;

    console.log(`\nUsing Email: ${email}`);

    let user = await prisma.user.findFirst({
        where: { email },
        include: { officer: true }
    });

    if (!user) {
        console.log('Creating new user...');
        user = await prisma.user.create({
            data: {
                email,
                externalId: `mock_${Date.now()}`, // ensure unique externalId for mock users
                password: 'password123',
                role: 'OFFICER',
                name: `Officer ${roleKey} ${contextSuffix.replace(/_/g, ' ')}`.trim(),
            },
            include: { officer: true }
        });
    }

    // 5. Create/Update Officer Profile
    console.log('Updating Officer Profile...');

    const officeName = departmentName ? `${roleKey} (${departmentName})` :
        facultyName ? `${roleKey} (${facultyName})` :
            `${roleKey} Office`;

    if (!user.officer) {
        await prisma.officer.create({
            data: {
                userId: user.id,
                name: user.name,
                departmentId: department?.id,
                role: roleKey,
                assignedOffices: config.offices,
                assignedDepartmentId: department?.id,
                assignedDepartmentName: department?.name,
                assignedOfficeName: officeName,
                // Legacy
                assignedOfficeId: config.offices[0],
            }
        });
    } else {
        await prisma.officer.update({
            where: { id: user.officer.id },
            data: {
                role: roleKey, // Update role
                assignedOffices: config.offices,
                departmentId: department?.id || user.officer.departmentId,
                assignedDepartmentId: department?.id,
                assignedDepartmentName: department?.name,
            }
        });
    }

    // 6. Link HOD to Department if applicable
    if (roleKey === 'HOD' && department) {
        // Find fresh officer ID
        const officer = await prisma.officer.findUnique({ where: { userId: user.id } });
        if (officer) {
            await prisma.department.update({
                where: { id: department.id },
                data: { hodOfficerId: officer.id }
            });
            console.log('Linked as HOD of Department');
        }
    }

    // 7. Generate Token
    // Refetch to get everything
    user = await prisma.user.findFirst({
        where: { id: user.id },
        include: { officer: true }
    });

    if (!user || !user.officer) throw new Error("Failed to load officer");

    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        // Officer Specific Payload Fields
        officeRole: roleKey,
        assignedOffices: user.officer.assignedOffices,
        assignedDepartmentId: user.officer.assignedDepartmentId,
        assignedDepartmentName: user.officer.assignedDepartmentName,
        // Legacy support
        officerId: user.officer.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    console.log('\n==========================================');
    console.log('GENERATED OFFICER TOKEN');
    console.log('==========================================\n');
    console.log(token);
    console.log('\n==========================================');
    // console.log(`Login URL: http://localhost:3000/api/auth/verify?token=${token}`);
    console.log(`Test URL with manual token param (for dev):`);
    console.log(`http://localhost:3000/?token=${token}`);

    rl.close();
}

generateOfficerToken()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
