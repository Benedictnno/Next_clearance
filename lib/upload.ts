import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveUpload(studentId: number, stepId: number, file: File): Promise<string> {
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads', String(studentId), String(stepId));
  await ensureDir(uploadRoot);

  const orig = sanitizeName(file.name);
  const name = `${Date.now()}_${orig || randomUUID()}`;
  const dest = path.join(uploadRoot, name);

  const arrayBuffer = await file.arrayBuffer();
  await fs.promises.writeFile(dest, Buffer.from(arrayBuffer));

  return `/uploads/${studentId}/${stepId}/${name}`;
}


