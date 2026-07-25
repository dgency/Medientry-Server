console.error(
  '[media:migrate:spaces] This legacy Spaces migration command has been retired. Use `npm run media:migrate-to-database -- --dry-run` or `npm run media:migrate-to-database -- --apply` instead.',
);

process.exitCode = 1;
