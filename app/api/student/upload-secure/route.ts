// app/api/student/upload-secure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import { collections } from '@/lib/mongoCollections';
import { notify } from '@/lib/helpers';
import { security, applySecurityHeaders, withRateLimit } from '@/lib/security';
import { schemas, validators } from '@/lib/validators';

const uploadHandler = async (req: NextRequest) => {
  try {
    const auth = await requireRole('STUDENT');
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }
    
    const { session } = auth;
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }
    const formData = await req.formData();
    
    const stepId = formData.get('step_id') as string;
    const file = formData.get('file') as File;
    
    if (!stepId || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate step ID
    try {
      validators.validateBody(schemas.common.objectId, stepId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
    }

    // Validate file
    const fileValidation = security.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (!fileValidation.valid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    // Check for malicious content
    const contentCheck = await security.checkFileContent(file);
    if (!contentCheck.safe) {
      return NextResponse.json({ error: contentCheck.reason }, { status: 400 });
    }

    // Get student data
    const { students, progress } = await collections();
    const student = await students.findOne({ userId: session.userId });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if step is current for this student
    const currentProgress = await progress.findOne({
      studentId: student._id,
      stepId: new ObjectId(stepId),
      status: 'pending'
    });

    if (!currentProgress) {
      return NextResponse.json({ 
        error: 'This step is not currently available for upload' 
      }, { status: 400 });
    }

    // Generate secure filename
    const secureFilename = security.generateSecureFilename(
      file.name, 
      String(session.userId)
    );

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Save file
    const filePath = join(uploadsDir, secureFilename);
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // Update progress with file URL
    const fileUrl = `/uploads/${secureFilename}`;
    await progress.updateOne(
      { _id: currentProgress._id },
      { 
        $set: { 
          receiptUrl: fileUrl,
          status: 'pending',
          updatedAt: new Date()
        } 
      }
    );

    // Notify student
    await notify(
      String(session.userId),
      'Document Uploaded',
      'Your document has been uploaded and is pending review.',
      'info'
    );

    const response = NextResponse.json({
      ok: true,
      message: 'Document uploaded successfully',
      fileUrl
    });
    return applySecurityHeaders(response);

  } catch (error: any) {
    console.error('Upload error:', error);
    const response = NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
};

// Apply rate limiting (5 uploads per minute)
export const POST = withRateLimit(5, 60000)(uploadHandler);
