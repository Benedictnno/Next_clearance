import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    // Check for multiple files (field name 'files') or single file (field name 'file')
    const filesFromForm = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File;

    // Determine if we're handling single or multiple files
    const files: File[] = filesFromForm.length > 0 ? filesFromForm : (singleFile ? [singleFile] : []);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size and type
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const useBlob = !!process.env.VERCEL && !!process.env.BLOB_READ_WRITE_TOKEN;
    // For local dev, write to public/uploads as before
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!useBlob) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Process all files
    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type for ${file.name}. Please upload PDF, DOC, DOCX, or image files.` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = path.extname(file.name) || '';
      const fileName = `${timestamp}_${randomString}${fileExtension}`;

      let fileUrl: string;
      if (useBlob) {
        // Upload to Vercel Blob (public)
        // Convert File to Buffer so content-length is known
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await put(fileName, fileBuffer, {
          access: 'public',
          contentType: file.type,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        fileUrl = uploaded.url;
      } else {
        // Local filesystem (development)
        const filePath = path.join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        fileUrl = `/uploads/${fileName}`;
      }

      // Add file info to results
      uploadedFiles.push({
        originalName: file.name,
        fileName: fileName,
        url: fileUrl,
        fileUrl: fileUrl, // Alias for compatibility
        size: file.size,
        type: file.type,
        mimeType: file.type, // Alias for compatibility
        uploadedAt: new Date().toISOString()
      });
    }

    // Return response based on single or multiple files
    if (uploadedFiles.length === 1 && singleFile) {
      // Single file upload (backward compatibility)
      return NextResponse.json({
        success: true,
        data: uploadedFiles[0]
      });
    } else {
      // Multiple files upload
      return NextResponse.json({
        success: true,
        files: uploadedFiles,
        count: uploadedFiles.length
      });
    }

  } catch (error: any) {
    console.error('Upload error:', error);
    const hint = process.env.VERCEL ? 'In Vercel, local filesystem is read-only. Set STORAGE_PROVIDER=vercel_blob and configure BLOB_READ_WRITE_TOKEN.' : undefined;
    return NextResponse.json(
      { error: 'Upload failed', details: error.message, hint },
      { status: 500 }
    );
  }
}
