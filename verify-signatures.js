
const { prisma } = require('./lib/prisma');
const { clearanceWorkflow } = require('./lib/clearanceWorkflow');

async function verifySignatures() {
    try {
        // Find a student who has a clearance request
        const student = await prisma.student.findFirst({
            include: {
                clearanceRequests: {
                    include: {
                        steps: {
                            where: { status: 'APPROVED' },
                            include: { officer: { include: { user: true } } }
                        }
                    }
                }
            }
        });

        if (!student) {
            console.log('No student found');
            return;
        }

        console.log(`Verifying signatures for Student: ${student.firstName} ${student.lastName} (${student.id})`);

        const status = await clearanceWorkflow.getStudentStatus(student.id);

        console.log('Offices Status:');
        status.offices.forEach(office => {
            if (office.status === 'approved') {
                console.log(`- ${office.officeName}:`);
                console.log(`  - Status: ${office.status}`);
                console.log(`  - Officer: ${office.officerName}`);
                console.log(`  - Signature: ${office.signatureUrl}`);
            }
        });

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        process.exit(0);
    }
}

verifySignatures();
