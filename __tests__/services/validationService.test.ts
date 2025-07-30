import { 
  ValidationService, 
  TicketSchema, 
  TechnicianSchema, 
  ScheduleSchema 
} from '../../services/validationService'

describe('ValidationService', () => {
  describe('validateTicket', () => {
    it('should validate a valid ticket', () => {
      const validTicket = {
        title: 'Test Ticket',
        color: '#FF5733'
      }
      
      const result = ValidationService.validateTicket(validTicket)
      
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject(validTicket)
    })
    
    it('should reject ticket with empty title', () => {
      const invalidTicket = {
        title: '',
        color: '#FF5733'
      }
      
      const result = ValidationService.validateTicket(invalidTicket)
      
      expect(result.success).toBe(false)
      expect(result.errors?.issues[0].message).toContain('requis')
    })
    
    it('should reject ticket with invalid color', () => {
      const invalidTicket = {
        title: 'Test',
        color: 'not-a-hex-color'
      }
      
      const result = ValidationService.validateTicket(invalidTicket)
      
      expect(result.success).toBe(false)
      expect(result.errors?.issues[0].message).toContain('hexadécimal')
    })
    
    it('should reject ticket with title too long', () => {
      const invalidTicket = {
        title: 'a'.repeat(256),
        color: '#FF5733'
      }
      
      const result = ValidationService.validateTicket(invalidTicket)
      
      expect(result.success).toBe(false)
      expect(result.errors?.issues[0].message).toContain('255 caractères')
    })
    
    it('should validate ticket with optional fields', () => {
      const validTicket = {
        title: 'Test Ticket',
        color: '#FF5733',
        description: 'Test description',
        estimated_duration: 60,
        hour: 14,
        minutes: 30
      }
      
      const result = ValidationService.validateTicket(validTicket)
      
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject(validTicket)
    })
    
    it('should reject invalid duration', () => {
      const invalidTicket = {
        title: 'Test',
        color: '#FF5733',
        estimated_duration: 25 // Not multiple of 15
      }
      
      const result = ValidationService.validateTicket(invalidTicket)
      
      expect(result.success).toBe(false)
      expect(result.errors?.issues[0].message).toContain('multiple de 15')
    })
  })
  
  describe('validateTechnician', () => {
    it('should validate a valid technician', () => {
      const validTechnician = {
        id: 1,
        name: 'John Doe',
        color: '#3B82F6',
        active: true
      }
      
      const result = ValidationService.validateTechnician(validTechnician)
      
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject(validTechnician)
    })
    
    it('should reject technician without name', () => {
      const invalidTechnician = {
        id: 1,
        name: '',
        color: '#3B82F6',
        active: true
      }
      
      const result = ValidationService.validateTechnician(invalidTechnician)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('validateSchedule', () => {
    it('should validate a valid schedule', () => {
      const validSchedule = {
        id: 1,
        technician_id: 1,
        date: '2024-01-01',
        type: 'available' as const,
        start_hour: 8,
        end_hour: 17
      }
      
      const result = ValidationService.validateSchedule(validSchedule)
      
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject(validSchedule)
    })
    
    it('should reject invalid date format', () => {
      const invalidSchedule = {
        id: 1,
        technician_id: 1,
        date: '01/01/2024', // Wrong format
        type: 'available' as const,
        start_hour: 8,
        end_hour: 17
      }
      
      const result = ValidationService.validateSchedule(invalidSchedule)
      
      expect(result.success).toBe(false)
    })
    
    it('should reject invalid schedule type', () => {
      const invalidSchedule = {
        id: 1,
        technician_id: 1,
        date: '2024-01-01',
        type: 'invalid-type' as any,
        start_hour: 8,
        end_hour: 17
      }
      
      const result = ValidationService.validateSchedule(invalidSchedule)
      
      expect(result.success).toBe(false)
    })
    
    it('should reject invalid hours', () => {
      const invalidSchedule = {
        id: 1,
        technician_id: 1,
        date: '2024-01-01',
        type: 'available' as const,
        start_hour: 25, // Invalid
        end_hour: 17
      }
      
      const result = ValidationService.validateSchedule(invalidSchedule)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('sanitizeString', () => {
    it('should remove HTML characters', () => {
      const input = 'Hello <script>alert("XSS")</script> World'
      const sanitized = ValidationService.sanitizeString(input)
      
      expect(sanitized).toBe('Hello scriptalert("XSS")/script World')
    })
    
    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const sanitized = ValidationService.sanitizeString(input)
      
      expect(sanitized).toBe('Hello World')
    })
    
    it('should limit length to 1000 characters', () => {
      const input = 'a'.repeat(1500)
      const sanitized = ValidationService.sanitizeString(input)
      
      expect(sanitized.length).toBe(1000)
    })
  })
  
  describe('isValidDateString', () => {
    it('should validate correct date format', () => {
      expect(ValidationService.isValidDateString('2024-01-01')).toBe(true)
      expect(ValidationService.isValidDateString('2024-12-31')).toBe(true)
    })
    
    it('should reject incorrect date format', () => {
      expect(ValidationService.isValidDateString('01/01/2024')).toBe(false)
      expect(ValidationService.isValidDateString('2024-1-1')).toBe(false)
      expect(ValidationService.isValidDateString('invalid')).toBe(false)
    })
    
    it('should reject invalid dates', () => {
      expect(ValidationService.isValidDateString('2024-13-01')).toBe(false)
      expect(ValidationService.isValidDateString('2024-01-32')).toBe(false)
    })
  })
  
  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(ValidationService.isValidHexColor('#FF5733')).toBe(true)
      expect(ValidationService.isValidHexColor('#ff5733')).toBe(true)
      expect(ValidationService.isValidHexColor('#123ABC')).toBe(true)
    })
    
    it('should reject invalid hex colors', () => {
      expect(ValidationService.isValidHexColor('FF5733')).toBe(false)
      expect(ValidationService.isValidHexColor('#FF573')).toBe(false)
      expect(ValidationService.isValidHexColor('#GG5733')).toBe(false)
      expect(ValidationService.isValidHexColor('red')).toBe(false)
    })
  })
  
  describe('formatValidationErrors', () => {
    it('should format errors correctly', () => {
      const result = ValidationService.validateTicket({ title: '', color: 'invalid' })
      
      if (!result.success && result.errors) {
        const formatted = ValidationService.formatValidationErrors(result.errors)
        
        expect(formatted).toBeInstanceOf(Array)
        expect(formatted.length).toBeGreaterThan(0)
        expect(formatted.some(f => f.includes(':'))).toBe(true)
      }
    })
  })
  
  describe('getFirstErrorMessage', () => {
    it('should return first error message', () => {
      const result = ValidationService.validateTicket({ title: '', color: 'invalid' })
      
      if (!result.success && result.errors) {
        const message = ValidationService.getFirstErrorMessage(result.errors)
        
        expect(typeof message).toBe('string')
        expect(message.length).toBeGreaterThan(0)
      }
    })
  })
})