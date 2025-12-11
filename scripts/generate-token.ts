
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eksu_clearance';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: MONGODB_URI
        }
    }
});

async function generateToken() {
    // 1. Ensure Department Exists (for HOD assignment)
    let department = await prisma.department.findUnique({ where: { name: 'Geography' } });
    if (!department) {
        // Fallback if not run after officer script, though usually officer script sets this up
        department = await prisma.department.create({
            data: { name: 'Geography' }
        });
        console.log('Created Department: Geography');
    }

    // 2. Find a test student
    console.log('Finding a test student...');
    let user = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        include: { student: true }
    });

    if (!user) {
        console.log('No student found, creating one...');
        // Create a dummy user if none exists
        try {
            user = await prisma.user.create({
                data: {
                    email: 'test_student2@eksu.edu.ng',
                    password: 'password123',
                    role: 'STUDENT',
                    name: 'Test Student',
                    student: {
                        create: {
                            matricNumber: 'TEST/2023/001',
                            firstName: 'Test',
                            lastName: 'Student',
                            level: '400',
                            departmentId: department.id
                        }
                    }
                },
                include: { student: true }
            });
        } catch (e) {
            console.error("Error creating user:", e);
            return;
        }
    } else if (user.student && !user.student.departmentId) {
        // Fix existing student without department
        console.log('Updating existing student with department...');
        await prisma.student.update({
            where: { id: user.student.id },
            data: { departmentId: department.id }
        });
        // Reload
        user = await prisma.user.findFirst({
            where: { id: user.id },
            include: { student: true }
        });
    }

    // Check if Department has HOD
    if (department) {
        const deptWithHod = await prisma.department.findUnique({
            where: { id: department.id },
            include: { hodOfficer: true }
        });

        if (!deptWithHod?.hodOfficer) {
            console.warn('\n⚠️  WARNING: The "Computer Science" department has no HOD assigned!');
            console.warn('    Clearance requests will FAIL for this student.');
            console.warn('    Run "npx tsx scripts/generate-officer-token.ts" to fix this.\n');
        } else {
            console.log(`✓ Department ${department.name} has HOD: ${deptWithHod.hodOfficer.name}`);
        }
    }

    if (!user || !user.student) {
        console.error("Failed to find or create user/student.");
        return;
    }

    console.log(`Found User: ${user.email} (${user.id})`);

    // 2. Generate Token
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        matricNumber: user.student.matricNumber,
        name: user.name,
        // Add other fields as per lib/auth.ts if needed
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    console.log('\n==========================================');
    console.log('GENERATED TEST TOKEN:');
    console.log('==========================================\n');
    console.log(token);
    console.log('\n==========================================');
    console.log('Use this token in the "auth_token" cookie or Authorization header.');
}

generateToken()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
