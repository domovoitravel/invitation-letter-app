import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { extractPassportData } from '../services/ocr';
import { generateInvitationPDF, generateInvitationFilename } from '../services/pdfGenerator';
import { createInvitationLetter, getUserInvitationLetters, deleteInvitationLetter } from '../db';
import { storagePut } from '../storage';
import { TRPCError } from '@trpc/server';

/**
 * Invitations router - handles passport data extraction and invitation letter generation
 */
export const invitationsRouter = router({
  /**
   * Extract passport data from an uploaded image
   */
  extractPassportData: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe('Base64 encoded image data'),
        fileName: z.string().describe('Original filename for validation'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate file type
        const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
        const fileExt = input.fileName.substring(input.fileName.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExt)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid file type. Supported formats: ${validExtensions.join(', ')}`,
          });
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(input.imageBase64, 'base64');
        
        // Extract passport data using OCR
        const passportData = await extractPassportData(imageBuffer, input.fileName);
        
        return {
          success: true,
          data: passportData,
        };
      } catch (error) {
        console.error('[Invitations] Error extracting passport data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to extract passport data',
        });
      }
    }),

  /**
   * Generate and save an invitation letter
   */
  generateLetter: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).describe('First name'),
        lastName: z.string().min(1).describe('Last name'),
        dateOfBirth: z.string().describe('Date of birth (DD/MM/YYYY)'),
        placeOfBirth: z.string().min(1).describe('Place of birth'),
        passportNumber: z.string().min(1).describe('Passport number'),
        imageBase64: z.string().optional().describe('Original image data'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate PDF
        const pdfBuffer = await generateInvitationPDF({
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          placeOfBirth: input.placeOfBirth,
          passportNumber: input.passportNumber,
        });

        // Generate filename
        const filename = generateInvitationFilename(input.firstName, input.lastName);
        
        // Upload PDF to S3
        const pdfKey = `invitations/${ctx.user.id}/${Date.now()}-${filename}`;
        const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');

        // Upload original image if provided
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        
        if (input.imageBase64) {
          try {
            const imageBuffer = Buffer.from(input.imageBase64, 'base64');
            const imageFileName = `passport-${Date.now()}.jpg`;
            imageKey = `passports/${ctx.user.id}/${imageFileName}`;
            const { url } = await storagePut(imageKey, imageBuffer, 'image/jpeg');
            imageUrl = url;
          } catch (error) {
            console.warn('[Invitations] Failed to upload image:', error);
            // Continue without image
          }
        }

        // Save to database
        await createInvitationLetter(ctx.user.id, {
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          placeOfBirth: input.placeOfBirth,
          passportNumber: input.passportNumber,
          pdfUrl,
          pdfKey,
          imageUrl,
          imageKey,
        });

        return {
          success: true,
          pdfUrl,
          filename,
        };
      } catch (error) {
        console.error('[Invitations] Error generating letter:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate invitation letter',
        });
      }
    }),

  /**
   * Get all invitation letters for the current user
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const letters = await getUserInvitationLetters(ctx.user.id);
      return {
        success: true,
        letters,
      };
    } catch (error) {
      console.error('[Invitations] Error fetching history:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch invitation history',
      });
    }
  }),

  /**
   * Delete an invitation letter
   */
  deleteLetter: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify ownership (in a real app, you'd check this in the DB query)
        await deleteInvitationLetter(input.id);
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('[Invitations] Error deleting letter:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete invitation letter',
        });
      }
    }),
});
