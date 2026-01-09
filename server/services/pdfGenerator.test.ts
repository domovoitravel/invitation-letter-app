import { describe, it, expect } from 'vitest';
import { generateInvitationFilename } from '../services/pdfGenerator';

describe('PDF Generator Service', () => {
  describe('generateInvitationFilename', () => {
    it('should generate correct filename format', () => {
      const filename = generateInvitationFilename('Mohammed', 'Asif');
      expect(filename).toBe('invitation-asif-mohammed.pdf');
    });

    it('should handle names with special characters', () => {
      const filename = generateInvitationFilename('Jean-Pierre', "O'Brien");
      expect(filename).toBe('invitation-obrien-jeanpierre.pdf');
    });

    it('should convert to lowercase', () => {
      const filename = generateInvitationFilename('JOHN', 'DOE');
      expect(filename).toBe('invitation-doe-john.pdf');
    });

    it('should remove spaces from names', () => {
      const filename = generateInvitationFilename('Mary Ann', 'Van Der Berg');
      expect(filename).toBe('invitation-vanderberg-maryann.pdf');
    });

    it('should handle single character names', () => {
      const filename = generateInvitationFilename('A', 'B');
      expect(filename).toBe('invitation-b-a.pdf');
    });
  });

  describe('generateInvitationPDF', () => {
    it('should generate a valid PDF buffer', async () => {
      const { generateInvitationPDF } = await import('../services/pdfGenerator');
      
      const pdfBuffer = await generateInvitationPDF({
        firstName: 'Mohammed',
        lastName: 'Asif',
        dateOfBirth: '21/08/1995',
        placeOfBirth: 'Bidasar, Rajasthan',
        passportNumber: 'R9909573',
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
      expect(pdfHeader).toContain('%PDF');
    });

    it('should handle ASCII characters in data', async () => {
      const { generateInvitationPDF } = await import('../services/pdfGenerator');
      
      const pdfBuffer = await generateInvitationPDF({
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '15/03/1990',
        placeOfBirth: 'London, UK',
        passportNumber: 'AB123456',
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
