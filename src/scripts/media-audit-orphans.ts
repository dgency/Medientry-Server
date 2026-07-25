import { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';

const main = async () => {
  const [databaseAssetsWithoutBlobs, blobsWithoutAssets] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: {
        storageType: 'database',
        blob: {
          is: null,
        },
      },
      select: {
        id: true,
        filename: true,
        publicUrl: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
    prisma.$queryRaw<Array<{ mediaId: string }>>(Prisma.sql`
      SELECT "mediaId"
      FROM "media_blobs"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "media_assets"
        WHERE "media_assets"."id" = "media_blobs"."mediaId"
      )
      ORDER BY "mediaId" ASC
      LIMIT 100
    `),
  ]);

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        databaseAssetsWithoutBlobsCount: databaseAssetsWithoutBlobs.length,
        blobsWithoutAssetsCount: blobsWithoutAssets.length,
        databaseAssetsWithoutBlobs,
        blobsWithoutAssets,
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    const isMissingMigration =
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && (error.code === 'P2021' || error.code === 'P2022');

    if (isMissingMigration) {
      console.error(
        '[media:audit-orphans] Database schema is not ready. Run `npm run prisma:migrate` before auditing database-backed media orphans.',
      );
    }

    console.error('[media:audit-orphans] Audit failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
