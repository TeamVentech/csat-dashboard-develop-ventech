import { HttpException, HttpStatus } from '@nestjs/common';

export class PhoneValidator {
  /**
   * Format phone number to ensure it has the proper country code format
   * @param phone The phone number to format
   * @returns Formatted phone number with proper country code
   */
  static formatPhoneNumber(phone: string): string {
    // Trim leading/trailing spaces
    let cleanPhone = phone.trim();
    // Remove any spaces or special characters
    cleanPhone = cleanPhone.replace(/\s+/g, '').replace(/[()-]/g, '');
    
    // Validate the phone number format
    this.validatePhoneNumber(cleanPhone);
    
    // Apply standard formatting rules
    if (cleanPhone.startsWith('07')) {
      return '+9627' + cleanPhone.substring(2);
    }
    
    if (cleanPhone.startsWith('0')) {
      return '+962' + cleanPhone.substring(1);
    }
    
    if (cleanPhone.startsWith('+962')) {
      return cleanPhone;
    }
    
    if (cleanPhone.startsWith('962')) {
      return '+' + cleanPhone;
    }
    // For numbers without country code, assume Jordan and prepend +962
    return '+962' + cleanPhone;
  }
  
  /**
   * Validate the phone number format according to Jordan standards
   * @param phone The phone number to validate
   * @throws HttpException if the phone number is invalid
   */
  static validatePhoneNumber(phone: string): void {
    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Define valid phone number patterns
    const validPatterns = [
      { pattern: /^07\d{8}$/, length: 10 },           // 07XXXXXXXX (10 digits)
      { pattern: /^00962\d{9}$/, length: 14 },        // 00962XXXXXXXX
      { pattern: /^\+962\d{9}$/, length: 12 },        // +962XXXXXXXX
      { pattern: /^962\d{9}$/, length: 12 },          // 962XXXXXXXX
      { pattern: /^[7-9]\d{8}$/, length: 9 }          // 7XXXXXXXX (without country code)
    ];
    
    const isValid = validPatterns.some(({ pattern, length }) => 
            pattern.test(phone) && digitsOnly.length === length
    );
    
    if (!isValid) {
      throw new HttpException(
        'Invalid phone number format. Please provide a valid Jordan phone number.',
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 