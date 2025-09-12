// /apps/web/src/lib/processAndSavePage.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This is a simplified version. In reality, this function would need to handle all the fields
// from the OCDS API response and map them to the new relational schema.
export async function processAndSavePage(releases: any[]) {
  for (const release of releases) {
    try {
      // Upsert the main release
      const releaseRecord = await prisma.release.upsert({
        where: { ocid: release.ocid },
        update: {
          releaseId: release.id,
          releaseDate: new Date(release.date),
          initiationType: release.initiationType,
          language: release.language,
          tags: release.tag,
          updatedAt: new Date(),
        },
        create: {
          ocid: release.ocid,
          releaseId: release.id,
          releaseDate: new Date(release.date),
          initiationType: release.initiationType,
          language: release.language,
          tags: release.tag,
        },
      });

      // Process tender
      if (release.tender) {
        await prisma.tender.upsert({
          where: { releaseId: releaseRecord.id },
          update: {
            tenderId: release.tender.id,
            title: release.tender.title,
            status: release.tender.status,
            description: release.tender.description,
            mainProcurementCategory: release.tender.mainProcurementCategory,
            procurementMethod: release.tender.procurementMethod,
            procurementMethodDetails: release.tender.procurementMethodDetails,
            valueJson: release.tender.value,
            tenderPeriodJson: release.tender.tenderPeriod,
            procuringEntityJson: release.tender.procuringEntity,
          },
          create: {
            releaseId: releaseRecord.id,
            tenderId: release.tender.id,
            title: release.tender.title,
            status: release.tender.status,
            description: release.tender.description,
            mainProcurementCategory: release.tender.mainProcurementCategory,
            procurementMethod: release.tender.procurementMethod,
            procurementMethodDetails: release.tender.procurementMethodDetails,
            valueJson: release.tender.value,
            tenderPeriodJson: release.tender.tenderPeriod,
            procuringEntityJson: release.tender.procuringEntity,
          },
        });
      }

      // Process buyer
      if (release.buyer) {
        await prisma.buyer.upsert({
          where: { releaseId: releaseRecord.id },
          update: {
            buyerId: release.buyer.id,
            name: release.buyer.name,
          },
          create: {
            releaseId: releaseRecord.id,
            buyerId: release.buyer.id,
            name: release.buyer.name,
          },
        });
      }

      // Process parties
      if (release.parties) {
        for (const party of release.parties) {
          await prisma.party.upsert({
            where: { partyId_releaseId: { partyId: party.id, releaseId: releaseRecord.id } },
            update: {
              name: party.name,
              roles: party.roles,
              detailsJson: party.details,
            },
            create: {
              releaseId: releaseRecord.id,
              partyId: party.id,
              name: party.name,
              roles: party.roles,
              detailsJson: party.details,
            },
          });
        }
      }

      // Process awards
      if (release.awards) {
        for (const award of release.awards) {
          const awardRecord = await prisma.award.upsert({
            where: { awardId_releaseId: { awardId: award.id, releaseId: releaseRecord.id } },
            update: {
              title: award.title,
              status: award.status,
              awardDate: award.date ? new Date(award.date) : null,
              valueJson: award.value,
            },
            create: {
              releaseId: releaseRecord.id,
              awardId: award.id,
              title: award.title,
              status: award.status,
              awardDate: award.date ? new Date(award.date) : null,
              valueJson: award.value,
            },
          });

          // Process suppliers
          if (award.suppliers) {
            for (const supplier of award.suppliers) {
              await prisma.supplier.upsert({
                where: { supplierId_awardId: { supplierId: supplier.id, awardId: awardRecord.id } },
                update: {
                  name: supplier.name,
                },
                create: {
                  awardId: awardRecord.id,
                  supplierId: supplier.id,
                  name: supplier.name,
                },
              });
            }
          }
        }
      }

      // Process contracts
      if (release.contracts) {
        for (const contract of release.contracts) {
          await prisma.contract.upsert({
            where: { contractId_releaseId: { contractId: contract.id, releaseId: releaseRecord.id } },
            update: {
              awardID: contract.awardID,
              title: contract.title,
              status: contract.status,
              periodJson: contract.period,
              valueJson: contract.value,
            },
            create: {
              releaseId: releaseRecord.id,
              contractId: contract.id,
              awardID: contract.awardID,
              title: contract.title,
              status: contract.status,
              periodJson: contract.period,
              valueJson: contract.value,
            },
          });
        }
      }

      console.log(`Processed release ${release.ocid}`);
    } catch (error) {
      console.error(`Error processing release ${release.ocid}:`, error);
    }
  }
}