import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all users to find duplicate externalIds...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    const externalIdMap = new Map<string | null, string[]>();
    for (const user of users) {
        const eid = user.externalId;
        if (!externalIdMap.has(eid)) {
            externalIdMap.set(eid, []);
        }
        externalIdMap.get(eid)!.push(user.id);
    }

    for (const [eid, ids] of externalIdMap.entries()) {
        if (ids.length > 1) {
            console.log(`Found ${ids.length} users with externalId: ${eid}`);
            for (let i = 1; i < ids.length; i++) {
                const userId = ids[i];
                const newEid = `temp-${userId}`;
                console.log(`Updating user ${userId} with new externalId: ${newEid}`);
                await prisma.user.update({
                    where: { id: userId },
                    data: { externalId: newEid }
                });
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
