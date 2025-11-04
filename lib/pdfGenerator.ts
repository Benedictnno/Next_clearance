import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { ObjectId } from 'mongodb';
import { collections } from './mongoCollections';

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
   * Generate NYSC mobilization form PDF
   */
  async generateNYSCForm(data: NYSCFormData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText('EKITI STATE UNIVERSITY, ADO-EKITI', {
      x: 50,
      y: height - 50,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('NYSC MOBILIZATION FORM', {
      x: 180,
      y: height - 80,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Form number
    page.drawText(`Form No: ${data.formNumber}`, {
      x: 50,
      y: height - 110,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Student information section
    const studentInfoY = height - 150;
    page.drawText('STUDENT DETAILS', {
      x: 50,
      y: studentInfoY,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const studentDetails = [
      `Full Name: ${data.student.name}`,
      `Matriculation Number: ${data.student.matricNumber}`,
      `Department: ${data.student.department}`,
      `Faculty: ${data.student.faculty}`,
      `Level: ${data.student.level}`,
    ];

    studentDetails.forEach((detail, index) => {
      page.drawText(detail, {
        x: 70,
        y: studentInfoY - 25 - (index * 20),
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    });

    // NYSC eligibility section
    const eligibilityY = studentInfoY - 200;
    page.drawText('NYSC ELIGIBILITY CONFIRMATION', {
      x: 50,
      y: eligibilityY,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('This is to certify that the above-named student has completed all clearance requirements', {
      x: 70,
      y: eligibilityY - 30,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('and is eligible for NYSC mobilization.', {
      x: 70,
      y: eligibilityY - 50,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Generated date
    page.drawText(`Generated on: ${data.generatedDate.toLocaleDateString()}`, {
      x: 50,
      y: eligibilityY - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // QR Code section
    page.drawText('QR Code for Verification', {
      x: 450,
      y: eligibilityY - 100,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawText('This form is digitally generated and verifiable online.', {
      x: 50,
      y: 50,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

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
      const { students } = await collections();
      const student = await students.findOne({ _id: new ObjectId(studentId) });

      if (!student) return null;

      return {
        id: String(student._id),
        name: `${student.firstName} ${student.lastName}`,
        matricNumber: student.matricNumber,
        department: student.department,
        faculty: student.faculty,
        level: student.level,
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
      const { progress, steps } = await collections();

      const allSteps = await steps.find({}).sort({ stepNumber: 1 }).toArray();
      const studentProgress = await progress.find({ studentId }).toArray();

      return allSteps.map(step => {
        const stepProgress = studentProgress.find(p => String(p.stepId) === String(step._id));
        return {
          stepNumber: step.stepNumber,
          name: step.name,
          status: stepProgress?.status || 'pending',
          approvedDate: stepProgress?.status === 'approved' ? stepProgress.updatedAt : undefined,
          officerName: stepProgress?.officerId ? 'Officer' : undefined, // TODO: Get actual officer name
          comment: stepProgress?.comment || undefined,
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
