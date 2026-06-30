import { z } from 'zod';

const isRootRelativeAssetPath = (value: string) => /^\/[^\s]*$/.test(value);

export const assetUrlString = z.union([
  z.string().trim().url(),
  z.string().trim().refine(isRootRelativeAssetPath, {
    message: 'Must be a valid absolute URL or a root-relative asset path.',
  }),
]);

export const nullableAssetUrlString = z.union([
  assetUrlString,
  z.null(),
  z.literal(''),
]).optional();

export const nullableAbsoluteUrlString = z.union([
  z.string().trim().url(),
  z.null(),
  z.literal(''),
]).optional();
