import Tesseract from 'tesseract.js';

/**
 * Extracted passport data structure
 */
export interface PassportData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: DD/MM/YYYY
  placeOfBirth: string;
  passportNumber: string;
}

/**
 * Extract passport information from an image using OCR
 * @param fileBuffer - Image file buffer
 * @param fileName - Original filename
 * @returns Extracted passport data
 */
export async function extractPassportData(fileBuffer: Buffer, fileName: string): Promise<PassportData> {
  try {
    // For now, we only support image formats with OCR
    const supportedFormats = ['.jpg', '.jpeg', '.png'];
    const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    if (!supportedFormats.includes(fileExt)) {
      throw new Error('PDF support requires additional setup. Please use JPEG or PNG images.');
    }

    // Extract text from image using OCR with better settings
    const textToProcess = await extractTextFromImage(fileBuffer);

    // Parse the extracted text to find passport fields
    const passportData = parsePassportText(textToProcess);
    
    return passportData;
  } catch (error) {
    console.error('[OCR] Error extracting passport data:', error);
    throw new Error(`Failed to extract passport data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from an image using Tesseract OCR with improved settings
 */
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    const worker = await Tesseract.createWorker();
    
    // Set language to English and optimize for document recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-,. ',
    });
    
    const result = await worker.recognize(imageBuffer);
    const text = result.data.text;
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('[OCR] Error in image OCR:', error);
    throw new Error(`Failed to perform OCR on image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse OCR text to extract specific passport fields
 * Improved for Indian passport format
 */
export function parsePassportText(text: string): PassportData {
  // Split text into lines for better context analysis
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('[OCR] Extracted lines:', lines.slice(0, 20));
  
  let firstName = '';
  let lastName = '';
  let dateOfBirth = '';
  let placeOfBirth = '';
  let passportNumber = '';

  // Strategy: Look for specific labels and extract values after them
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    // Extract Surname (Last Name)
    if (line.match(/Surname|SURNAME/) && nextLine && !nextLine.match(/Surname|Given/i)) {
      lastName = nextLine.replace(/[^A-Za-z\s]/g, '').trim();
    }
    
    // Extract Given Name(s) (First Name)
    if (line.match(/Given Name|GIVEN NAME/) && nextLine && !nextLine.match(/Given|Nationality/i)) {
      firstName = nextLine.replace(/[^A-Za-z\s]/g, '').trim();
    }
    
    // Extract Date of Birth - look for "Date of Birth" label
    if (line.match(/Date of Birth|DOB/) && !line.match(/Date of Issue/i)) {
      // Try to find date in the same line or next line
      let dateStr = line + ' ' + nextLine;
      const dateMatch = dateStr.match(/(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{4})/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3];
        dateOfBirth = `${day}/${month}/${year}`;
      }
    }
    
    // Extract Place of Birth
    if (line.match(/Place of Birth|Place of birth/i)) {
      // Look in the next line for the place
      if (nextLine && !nextLine.match(/Nationality|Sex|Passport/i)) {
        placeOfBirth = nextLine.replace(/[^A-Za-z\s,]/g, '').trim();
      }
    }
    
    // Extract Passport Number - look for "Passport" label or pattern
    if (line.match(/Passport|PASSPORT/) && !line.match(/Passport Number/i)) {
      // Try to extract from same line
      const passportMatch = line.match(/([A-Z]\d{7,9})/);
      if (passportMatch) {
        passportNumber = passportMatch[1];
      }
    }
    
    // Also look for passport number pattern at the beginning of lines
    if (!passportNumber && line.match(/^[A-Z]\d{7,9}$/)) {
      passportNumber = line;
    }
    
    // Look for passport number with P prefix (Indian passports)
    if (!passportNumber && line.match(/^P\d{7,9}$/)) {
      passportNumber = line;
    }
  }

  // If we didn't find the data using labels, try alternative patterns
  if (!lastName || !firstName) {
    // Look for consecutive capital letter words
    for (const line of lines) {
      const words = line.split(/\s+/).filter(w => /^[A-Z][A-Za-z]*$/.test(w));
      if (words.length >= 2 && !line.match(/Surname|Given|Nationality|Passport/i)) {
        if (!lastName) lastName = words[0];
        if (!firstName && words.length > 1) firstName = words[1];
      }
    }
  }

  // If still no date of birth, look for any date pattern that's not in "Date of Issue"
  if (!dateOfBirth) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.match(/Date of Issue|Date of Expiry/i)) {
        const dateMatch = line.match(/(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{4})/);
        if (dateMatch) {
          // Validate it's a reasonable birth date (not too recent)
          const year = parseInt(dateMatch[3]);
          if (year < 2010) { // Birth year should be before 2010
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            dateOfBirth = `${day}/${month}/${year}`;
            break;
          }
        }
      }
    }
  }

  // Validate that we have extracted the essential fields
  if (!firstName || !lastName) {
    throw new Error('Could not extract name from passport document. Please ensure the image is clear and contains the name field.');
  }
  if (!passportNumber) {
    throw new Error('Could not extract passport number from document. Please ensure the image is clear and contains the passport number.');
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    dateOfBirth: dateOfBirth || 'Not found',
    placeOfBirth: placeOfBirth || 'Not found',
    passportNumber: passportNumber.trim(),
  };
}
