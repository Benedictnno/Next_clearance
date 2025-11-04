import { NextRequest } from 'next/server';
import { stat, readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await params;
    // prevent path traversal by joining and normalizing, then verifying prefix
    const joined = path.join(UPLOAD_DIR, ...segments);
    const resolved = path.resolve(joined);

    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return new Response('Not Found', { status: 404 });
    }

    const s = await stat(resolved);
    if (!s.isFile()) {
      return new Response('Not Found', { status: 404 });
    }

    const data = await readFile(resolved);
    const headers = new Headers();
    headers.set('Content-Type', getContentType(resolved));
    headers.set('Content-Length', String(s.size));
    headers.set('Cache-Control', 'private, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(data as any, { status: 200, headers });
  } catch (err) {
    return new Response('Not Found', { status: 404 });
  }
}
