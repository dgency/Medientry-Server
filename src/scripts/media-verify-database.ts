import { prisma } from '../config/prisma';

const main = async () => {
  const [databaseAssets, databaseBlobs, databaseAssetsMissingBlobs, legacyFilesystemAssets] =
    await Promise.all([
      prisma.mediaAsset.count({
        where: { storageType: 'database' },
      }),
      prisma.mediaBlob.count(),
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
        take: 50,
      }),
      prisma.mediaAsset.count({
        where: {
          storageType: {
            not: 'database',
          },
        },
      }),
    ]);

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        databaseAssets,
        databaseBlobs,
        legacyFilesystemAssets,
        databaseAssetsMissingBlobsCount: databaseAssetsMissingBlobs.length,
        databaseAssetsMissingBlobs,
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
        '[media:verify-database] Database schema is not ready. Run `npm run prisma:migrate` before verifying database-backed media.',
      );
    }

    console.error('[media:verify-database] Verification failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
