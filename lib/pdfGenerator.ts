import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { prisma } from './prisma';

export interface StudentData {
  id: string;
  name: string;
  matricNumber: string;
  department: string;
  faculty: string;
  level: string;
}

export interface ClearanceStepData {
  stepNumber: number;
  name: string;
  status: 'approved' | 'rejected' | 'pending';
  approvedDate?: Date;
  officerName?: string;
  comment?: string;
}

export interface ClearanceCertificateData {
  student: StudentData;
  steps: ClearanceStepData[];
  completionDate: Date;
  certificateNumber: string;
  qrCode: string;
}

export interface NYSCFormData {
  student: StudentData;
  nyscInfo?: {
    name: string;
    faculty: string;
    department: string;
    courseOfStudy: string;
    matricNumber: string;
    jambRegNo?: string | null;
    sex: string;
    dateOfBirthDay: string;
    dateOfBirthMonth: string;
    dateOfBirthYear: string;
    maritalStatus: string;
    stateOfOrigin: string;
    lgaOfOrigin: string;
    dateOfGraduation?: string | null;
    phoneNumber: string;
    email: string;
  } | null;
  formNumber: string;
  generatedDate: Date;
  qrCode: string;
}

class PDFGenerator {
  /**
   * Generate clearance certificate PDF
   */
  async generateClearanceCertificate(data: ClearanceCertificateData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Header
    page.drawText('EKITI STATE UNIVERSITY, ADO-EKITI', {
      x: 50,
      y: height - 50,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('DIGITAL CLEARANCE CERTIFICATE', {
      x: 150,
      y: height - 80,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Certificate number
    page.drawText(`Certificate No: ${data.certificateNumber}`, {
      x: 50,
      y: height - 110,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Student information
    const studentInfoY = height - 150;
    page.drawText('STUDENT INFORMATION', {
      x: 50,
      y: studentInfoY,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const infoItems = [
      `Name: ${data.student.name}`,
      `Matric Number: ${data.student.matricNumber}`,
      `Department: ${data.student.department}`,
      `Faculty: ${data.student.faculty}`,
      `Level: ${data.student.level}`,
    ];

    infoItems.forEach((item, index) => {
      page.drawText(item, {
        x: 70,
        y: studentInfoY - 25 - (index * 20),
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    });

    // Clearance steps
    const stepsY = studentInfoY - 200;
    page.drawText('CLEARANCE STEPS COMPLETED', {
      x: 50,
      y: stepsY,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Draw table header
    page.drawText('Step', {
      x: 50,
      y: stepsY - 30,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText('Department/Office', {
      x: 100,
      y: stepsY - 30,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText('Status', {
      x: 350,
      y: stepsY - 30,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText('Date', {
      x: 450,
      y: stepsY - 30,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Draw table rows
    data.steps.forEach((step, index) => {
      const rowY = stepsY - 50 - (index * 20);

      page.drawText(step.stepNumber.toString(), {
        x: 50,
        y: rowY,
        size: 9,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(step.name, {
        x: 100,
        y: rowY,
        size: 9,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(step.status.toUpperCase(), {
        x: 350,
        y: rowY,
        size: 9,
        font: helveticaFont,
        color: step.status === 'approved' ? rgb(0, 0.5, 0) : rgb(0.5, 0, 0),
      });

      if (step.approvedDate) {
        page.drawText(step.approvedDate.toLocaleDateString(), {
          x: 450,
          y: rowY,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
    });

    // Completion date
    const completionY = stepsY - 200 - (data.steps.length * 20);
    page.drawText(`Clearance Completed: ${data.completionDate.toLocaleDateString()}`, {
      x: 50,
      y: completionY,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // QR Code (placeholder - would need actual QR code generation)
    page.drawText('QR Code for Verification', {
      x: 450,
      y: completionY - 50,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawText('This certificate is digitally generated and verifiable online.', {
      x: 50,
      y: 50,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
  }

  /**
   * Generate NYSC mobilization form PDF matching physical EKSU layout
   */
  async generateNYSCForm(data: NYSCFormData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const info = data.nyscInfo;

    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // --- Header Section ---
    // University Name
    page.drawText('EKITI STATE UNIVERSITY, ADO-EKITI', {
      x: width / 2 - 130,
      y: height - 50,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // P.M.B. Address
    page.drawText('P.M. B. 5363, ADO-EKITI, EKITI STATE', {
      x: width / 2 - 100,
      y: height - 65,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Form Title
    page.drawText('APPLICATION FORM FOR NATIONAL', {
      x: width / 2 - 110,
      y: height - 90,
      size: 13,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText('YOUTH SERVICE MOBILIZATION', {
      x: width / 2 - 100,
      y: height - 110,
      size: 13,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Passport Box Top Right
    const passportWidth = 80;
    const passportHeight = 90;
    page.drawRectangle({
      x: width - 130,
      y: height - 140,
      width: passportWidth,
      height: passportHeight,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0),
    });
    page.drawText('Affix', { x: width - 100, y: height - 70, size: 7, font: helveticaFont });
    page.drawText('passport', { x: width - 105, y: height - 80, size: 7, font: helveticaFont });
    page.drawText('photograph', { x: width - 110, y: height - 90, size: 7, font: helveticaFont });
    page.drawText('&', { x: width - 95, y: height - 100, size: 7, font: helveticaFont });
    page.drawText('write your', { x: width - 105, y: height - 110, size: 7, font: helveticaFont });
    page.drawText('name at the back', { x: width - 115, y: height - 120, size: 7, font: helveticaFont });

    // Introductory text
    page.drawText('In the space provided, please affix one passport photograph, using staple pin and must be', {
      x: 50,
      y: height - 140,
      size: 9,
      font: helveticaOblique,
    });
    page.drawText('duly stamped by your Head of Department', {
      x: 50,
      y: height - 152,
      size: 9,
      font: helveticaOblique,
    });

    page.drawText('Please peruse and complete the form appropriately', {
      x: 50,
      y: height - 170,
      size: 9,
      font: helveticaOblique,
    });

    // --- Numbered Fields Section ---
    let yPos = height - 200;
    const lineSpacing = 22;
    const leftMargin = 50;
    const labelX = 50;
    const valueX = 140;

    const drawUnderline = (x: number, y: number, length: number) => {
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + length, y: y - 2 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
    };

    // 1. Name
    page.drawText('1.   Name:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.name || data.student.name || '', { x: valueX, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX, yPos, 400);
    yPos -= lineSpacing;

    // 2. Faculty / Department
    page.drawText('2.   Faculty:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.faculty || data.student.faculty || '', { x: valueX, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX, yPos, 150);

    page.drawText('Department:', { x: 300, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.department || data.student.department || '', { x: 370, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(370, yPos, 170);
    yPos -= lineSpacing;

    // 3. Course of Study
    page.drawText('3.   Course of Study:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.courseOfStudy || 'N/A', { x: valueX + 40, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 40, yPos, 360);
    yPos -= lineSpacing;

    // 4. Matric Number
    page.drawText('4.   Matric Number:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.matricNumber || data.student.matricNumber || '', { x: valueX + 40, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 40, yPos, 360);
    yPos -= lineSpacing;

    // 5. JAMB Reg. No
    page.drawText('5.   JAMB Reg. No:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.jambRegNo || 'N/A', { x: valueX + 40, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 40, yPos, 360);
    yPos -= lineSpacing;

    // 6. Sex (Tick X)
    page.drawText('6.   Sex (Tick X)', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    const isMale = info?.sex?.toLowerCase() === 'male';
    const isFemale = info?.sex?.toLowerCase() === 'female';
    page.drawText(`Male ( ${isMale ? 'X' : ' '} )`, { x: 250, y: yPos, size: 10, font: helveticaFont });
    page.drawText(`Female ( ${isFemale ? 'X' : ' '} )`, { x: 400, y: yPos, size: 10, font: helveticaFont });
    yPos -= lineSpacing;

    // 7. Date of Birth (Grid)
    page.drawText('7.   Date of Birth', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    // Box for DOB
    const dobBoxY = yPos - 15;
    const boxW = 40;
    const boxH = 20;

    // Day
    page.drawRectangle({ x: 150, y: dobBoxY, width: boxW, height: boxH, borderWidth: 1 });
    page.drawText(info?.dateOfBirthDay || '', { x: 162, y: dobBoxY + 5, size: 10, font: helveticaBold });
    page.drawText('.Day', { x: 185, y: dobBoxY - 8, size: 7, font: helveticaFont });

    // Month
    page.drawRectangle({ x: 250, y: dobBoxY, width: boxW * 2, height: boxH, borderWidth: 1 });
    page.drawText(info?.dateOfBirthMonth || '', { x: 260, y: dobBoxY + 5, size: 10, font: helveticaBold });
    page.drawText('Month', { x: 280, y: dobBoxY - 8, size: 7, font: helveticaFont });

    // Year
    page.drawRectangle({ x: 400, y: dobBoxY, width: boxW * 2, height: boxH, borderWidth: 1 });
    page.drawText(info?.dateOfBirthYear || '', { x: 415, y: dobBoxY + 5, size: 10, font: helveticaBold });
    page.drawText('Year', { x: 430, y: dobBoxY - 8, size: 7, font: helveticaFont });

    yPos -= lineSpacing + 10;

    // 8. Marital Status (Tick x)
    page.drawText('8.   Marital Status (Tick x)', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    const isSingle = info?.maritalStatus?.toLowerCase() === 'single';
    const isMarried = info?.maritalStatus?.toLowerCase() === 'married';
    page.drawText(`Single ( ${isSingle ? 'X' : ' '} )`, { x: 250, y: yPos, size: 10, font: helveticaFont });
    page.drawText(`Married ( ${isMarried ? 'X' : ' '} )`, { x: 400, y: yPos, size: 10, font: helveticaFont });
    yPos -= lineSpacing;

    // 9. State of Origin
    page.drawText('9.   State of Origin:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.stateOfOrigin || '', { x: valueX + 30, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 30, yPos, 370);
    yPos -= lineSpacing;

    // 10. Local Government of Origin
    page.drawText('10. Local Government of Origin:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.lgaOfOrigin || '', { x: valueX + 90, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 90, yPos, 310);
    yPos -= lineSpacing;

    // 11. Date and Year of Graduation
    page.drawText('11. Date and Year of Graduation:', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.dateOfGraduation || 'N/A', { x: valueX + 95, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 95, yPos, 305);
    yPos -= lineSpacing;

    // 12. Phone Number / Email
    page.drawText('12. Phone Number(s):', { x: labelX, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.phoneNumber || '', { x: valueX + 45, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(valueX + 45, yPos, 150);

    page.drawText('Email Address:', { x: 345, y: yPos, size: 10, font: helveticaFont });
    page.drawText(info?.email || '', { x: 420, y: yPos, size: 10, font: helveticaBold });
    drawUnderline(420, yPos, 120);
    yPos -= lineSpacing + 10;

    // Student Confirmation
    page.drawText('I Confirm that the information provided by me above is true and authentic.', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaOblique,
    });
    yPos -= 30;

    page.drawLine({ start: { x: 300, y: yPos }, end: { x: 550, y: yPos }, thickness: 1 });
    page.drawText('Signature of Prospective Corps Member & Date', { x: 310, y: yPos - 12, size: 8, font: helveticaOblique });

    yPos -= 30;

    // N.B. Section
    page.drawText('N.B.', { x: 50, y: yPos, size: 9, font: helveticaBold });
    const nbs = [
      '•  Prospective corps member must attach a copy of notification Result or Certificate issued by the University',
      '•  This form should be filled personally as any information provided here is irreversible',
      '•  Alteration will not be entertained',
      '•  Complete form legibly please.'
    ];
    nbs.forEach((nb, idx) => {
      page.drawText(nb, { x: 60, y: yPos - 12 - (idx * 12), size: 8, font: helveticaFont });
    });

    yPos -= 70;

    // --- Official Use Section ---
    page.drawText('OFFICIAL USE ONLY', { x: width / 2 - 50, y: yPos, size: 11, font: helveticaBold });
    yPos -= 25;

    page.drawText('Verification of Results by the Admission Office', { x: 50, y: yPos, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
    drawUnderline(50, yPos, 200);
    yPos -= 15;

    page.drawText('I confirm that the results of the Student has been verified by Admission Office', { x: 50, y: yPos, size: 9, font: helveticaFont });
    yPos -= 30;

    page.drawLine({ start: { x: 300, y: yPos }, end: { x: 550, y: yPos }, thickness: 1 });
    page.drawText('Name and Signature of Admission Officer', { x: 330, y: yPos - 12, size: 8, font: helveticaOblique });

    yPos -= 40;

    // HOD Section
    page.drawText('HEAD OF DEPARTMENT', { x: 50, y: yPos, size: 10, font: helveticaBold });
    yPos -= 15;

    page.drawText(`I confirm that he/she is from the Department of ${info?.department || data.student.department || '_____________'} and his/her result was`, {
      x: 50, y: yPos, size: 9, font: helveticaFont
    });
    yPos -= 15;
    page.drawText('approved on _______________ /His or her result is yet to be approved but he/she is a graduating', {
      x: 50, y: yPos, size: 9, font: helveticaFont
    });
    yPos -= 15;
    page.drawText('student.', { x: 50, y: yPos, size: 9, font: helveticaFont });

    yPos -= 25;
    page.drawLine({ start: { x: 300, y: yPos }, end: { x: 550, y: yPos }, thickness: 1 });
    page.drawText('Head of Department Signature and Date', { x: 335, y: yPos - 12, size: 8, font: helveticaOblique });

    // Final Footer
    page.drawText('SUBMISSION TO STUDENTS\' AFFAIRS OFFICE', {
      x: 50,
      y: 40,
      size: 10,
      font: helveticaBold,
    });

    // Add QR Code at bottom left for digital verification
    if (data.qrCode) {
      try {
        const qrImage = await pdfDoc.embedPng(data.qrCode);
        page.drawImage(qrImage, {
          x: width - 80,
          y: 30,
          width: 50,
          height: 50,
        });
        page.drawText('Scan to Verify', { x: width - 80, y: 20, size: 6, font: helveticaFont });
      } catch (err) {
        console.warn('Could not embed QR code:', err);
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Generate QR code for verification
   */
  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  /**
   * Get student data for PDF generation
   */
  async getStudentDataForPDF(studentId: string): Promise<StudentData | null> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { department: true, faculty: true }
      });

      if (!student) return null;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        matricNumber: student.matricNumber,
        department: student.department?.name || 'N/A',
        faculty: student.faculty?.name || 'N/A',
        level: student.level || 'N/A',
      };
    } catch (error) {
      console.error('Error getting student data for PDF:', error);
      return null;
    }
  }

  /**
   * Get clearance steps data for PDF generation
   */
  async getClearanceStepsForPDF(studentId: string): Promise<ClearanceStepData[]> {
    try {
      const request = await prisma.clearanceRequest.findFirst({
        where: { studentId },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          }
        }
      });

      if (!request) return [];

      return request.steps.map(step => {
        return {
          stepNumber: step.stepNumber,
          name: step.officeName,
          status: step.status.toLowerCase() as 'approved' | 'rejected' | 'pending',
          approvedDate: step.status === 'APPROVED' ? (step.actionedAt || undefined) : undefined,
          officerName: step.officerId ? 'Authorized Officer' : undefined,
          comment: step.comment || undefined,
        };
      });
    } catch (error) {
      console.error('Error getting clearance steps for PDF:', error);
      return [];
    }
  }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();
