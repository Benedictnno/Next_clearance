import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import * as QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request: NextRequest) {
  try {
    // Get the student ID from query params
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('id');
    
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId || '' },
      include: {
        user: true,
        studentID: true
      }
    });

    if (!student || !student.studentID) {
      return NextResponse.json({ error: 'Student ID card not found' }, { status: 404 });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 250]);
    const { width, height } = page.getSize();
    
    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw header
    page.drawText('EKITI STATE UNIVERSITY', {
      x: 120,
      y: height - 30,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('STUDENT IDENTIFICATION CARD', {
      x: 100,
      y: height - 50,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw student information
    page.drawText(`Name: ${student.firstName} ${student.lastName}`, {
      x: 30,
      y: height - 80,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Matric Number: ${student.matricNumber}`, {
      x: 30,
      y: height - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Department: ${student.department}`, {
      x: 30,
      y: height - 120,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Faculty: ${student.faculty}`, {
      x: 30,
      y: height - 140,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Level: ${student.level}`, {
      x: 30,
      y: height - 160,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw card details
    page.drawText(`Card Number: ${student.studentID.cardNumber}`, {
      x: 30,
      y: height - 180,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Issued Date: ${new Date(student.studentID.issuedDate).toLocaleDateString()}`, {
      x: 30,
      y: height - 200,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Expiry Date: ${new Date(student.studentID.expiryDate).toLocaleDateString()}`, {
      x: 200,
      y: height - 200,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw QR code
    const qrCodeImage = await QRCode.toDataURL(`https://eksu-clearance.vercel.app/verify/${student.studentID.cardNumber}`);
    const qrCodeImageBytes = await fetch(qrCodeImage).then(res => res.arrayBuffer());
    const qrCodePdfImage = await pdfDoc.embedPng(qrCodeImageBytes);
    
    page.drawImage(qrCodePdfImage, {
      x: 280,
      y: height - 150,
      width: 100,
      height: 100,
    });
    
    // Draw footer
    page.drawText('This ID card is property of Ekiti State University.', {
      x: 80,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('If found, please return to the Student Affairs Office.', {
      x: 80,
      y: 20,
      size: 8,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${student.matricNumber}_ID_Card.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', message: error.message },
      { status: 500 }
    );
  }
}