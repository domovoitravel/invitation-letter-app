import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Data structure for invitation letter
 */
export interface InvitationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
}

/**
 * Generate an invitation letter PDF from the template
 * @param data - Invitation data to fill into the template
 * @returns PDF buffer
 */
export async function generateInvitationPDF(data: InvitationData): Promise<Buffer> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Define margins and positioning
    const margin = 40;
    const lineHeight = 18;
    let yPosition = height - margin;
    
    // Helper function to add text
    const addText = (text: string, fontSize: number = 11) => {
      page.drawText(text, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
        maxWidth: width - 2 * margin,
      });
      yPosition -= lineHeight;
    };
    
    // Add header
    addText('DOMOVOI TRAVEL', 14);
    addText('Benson Francis Paul Sole proprietorship', 10);
    addText('Address: Ave Baghramyan 70, 0033 Yerevan', 10);
    addText('Registration number: 264.1460655', 10);
    addText('Phone: +374 44761767 Email: contact@domovoi-travel.com', 10);
    addText('Website: www.domovoi-travel.com', 10);
    
    yPosition -= 20;
    
    // Add letter number and date
    addText('Letter No. 00190', 11);
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    addText(`Date: ${dateStr}`, 11);
    
    yPosition -= 20;
    
    // Add recipient
    addText('To: Armenian Visa Services', 11);
    
    yPosition -= 20;
    
    // Add section header
    addText('INVITED PERSON INFORMATION', 11);
    
    yPosition -= 15;
    
    // Add extracted data
    addText(`Name: ${data.firstName} ${data.lastName}`, 11);
    addText(`Date of Birth: ${data.dateOfBirth}`, 11);
    addText(`Place of Birth: ${data.placeOfBirth}`, 11);
    addText(`Passport Number: ${data.passportNumber}`, 11);
    
    yPosition -= 20;
    
    // Add footer text
    addText('I guarantee that the invited person will not violate Armenian migration rules', 10);
    addText('and will leave Armenia within the specified timeframe.', 10);
    
    yPosition -= 20;
    
    // Add signature line
    addText('_________________________', 11);
    addText('Signature', 10);
    
    // Convert to buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate filename for the invitation letter
 * @param firstName - First name of the invited person
 * @param lastName - Last name of the invited person
 * @returns Formatted filename
 */
export function generateInvitationFilename(firstName: string, lastName: string): string {
  // Remove special characters and spaces, convert to lowercase
  const sanitizedFirst = firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const sanitizedLast = lastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  return `invitation-${sanitizedLast}-${sanitizedFirst}.pdf`;
}
