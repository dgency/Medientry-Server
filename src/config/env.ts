import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

import { envSchema } from '../validations/env.validation';

const resolveProjectRoot = () => {
  const cwdRoot = process.cwd();
  const runtimeRoot = path.resolve(__dirname, '..', '..');

  return fs.existsSync(path.join(cwdRoot, 'package.json')) ? cwdRoot : runtimeRoot;
};

const projectRoot = resolveProjectRoot();
const envFileCandidates = [path.join(projectRoot, '.env'), path.join(projectRoot, '.env.local')];
const loadedEnvFiles: string[] = [];

for (const envFilePath of envFileCandidates) {
  if (!fs.existsSync(envFilePath)) {
    continue;
  }

  dotenv.config({
    path: envFilePath,
    override: true,
  });

  loadedEnvFiles.push(path.basename(envFilePath));
}

if (loadedEnvFiles.length > 0) {
  console.log(`[env] Loaded ${loadedEnvFiles.join(', ')} from ${projectRoot}`);
} else {
  console.warn(`[env] No .env file found in ${projectRoot}. Falling back to existing process.env values.`);
}

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = parsedEnv.data;
