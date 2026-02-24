import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function createHOD() {
    const departmentName = "Computer Science";
    const facultyName = "Science";
    const email = "hod_compsci@eksu.edu.ng";
    const name = "Computer Science HOD";

    console.log(`🚀 Creating HOD for ${departmentName}...`);

    try {
        // 1. Ensure Faculty exists
        let faculty = await prisma.faculty.findUnique({
            where: { name: facultyName }
        });

        if (!faculty) {
            faculty = await prisma.faculty.create({
                data: { name: facultyName }
            });
            console.log(`✅ Created Faculty: ${facultyName}`);
        }

        // 2. Ensure Department exists
        let department = await prisma.department.findUnique({
            where: { name: departmentName }
        });

        if (!department) {
            department = await prisma.department.create({
                data: {
                    name: departmentName,
                    facultyId: faculty.id
                }
            });
            console.log(`✅ Created Department: ${departmentName}`);
        }

        // 3. Create User if not exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    role: Role.OFFICER,
                    password: "password123", // Default password
                    externalId: `hod_compsci_${Date.now()}`
                }
            });
            console.log(`✅ Created User: ${email}`);
        }

        // 4. Create Officer record
        let officer = await prisma.officer.findUnique({
            where: { userId: user.id }
        });

        if (!officer) {
            officer = await prisma.officer.create({
                data: {
                    userId: user.id,
                    name,
                    role: "HOD",
                    assignedOffices: ["hod"],
                    assignedDepartmentId: department.id,
                    assignedDepartmentName: department.name,
                    departmentId: department.id
                }
            });
            console.log(`✅ Created Officer record for HOD`);
        }

        // 5. Link HOD to Department
        await prisma.department.update({
            where: { id: department.id },
            data: { hodOfficerId: officer.id }
        });
        console.log(`✅ Linked Officer as HOD of ${departmentName}`);

        console.log(`\n🎉 HOD account created successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: password123`);

    } catch (error) {
        console.error("❌ Error creating HOD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createHOD();
