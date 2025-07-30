import {
  normalizeTicket,
  isTicketPlanned,
  hasMultipleTechnicians,
  isTechnicianAssigned,
  getAssignedTechnicianIds,
  filterTicketsByTechnician,
  getPrimaryTechnician,
  canAddTechnician,
  canRemoveTechnician,
  getSlotIndex,
  getTimeFromSlot,
  snapToQuarterHour,
  getDurationSlots,
  formatDuration
} from '../../utils/ticketHelpers'

describe('ticketHelpers', () => {
  describe('normalizeTicket', () => {
    it('should normalize a ticket with technicians array', () => {
      const ticket = {
        id: 1,
        title: 'Test Ticket',
        color: '#fff3cd',
        technicians: [
          { id: 1, name: 'Tech 1', color: '#123456', is_primary: true, active: true }
        ]
      }
      
      const normalized = normalizeTicket(ticket)
      
      expect(normalized.technician_id).toBe(1)
      expect(normalized.technician_name).toBe('Tech 1')
      expect(normalized.technician_color).toBe('#123456')
      expect(normalized.technicians).toHaveLength(1)
    })
    
    it('should normalize a ticket with only technician_id', () => {
      const ticket = {
        id: 1,
        title: 'Test Ticket',
        color: '#fff3cd',
        technician_id: 2,
        technician: {
          id: 2,
          name: 'Tech 2',
          color: '#654321',
          active: true
        }
      }
      
      const normalized = normalizeTicket(ticket)
      
      expect(normalized.technician_id).toBe(2)
      expect(normalized.technician_name).toBe('Tech 2')
      expect(normalized.technician_color).toBe('#654321')
      expect(normalized.technicians).toHaveLength(1)
      expect(normalized.technicians?.[0].is_primary).toBe(true)
    })
    
    it('should handle ticket without technician', () => {
      const ticket = {
        id: 1,
        title: 'Test Ticket',
        color: '#fff3cd'
      }
      
      const normalized = normalizeTicket(ticket)
      
      expect(normalized.technician_id).toBeNull()
      expect(normalized.technician_name).toBe('Non assigné')
      expect(normalized.technician_color).toBe('#6B7280')
      expect(normalized.technicians).toHaveLength(0)
    })
  })
  
  describe('isTicketPlanned', () => {
    it('should return true for ticket with date', () => {
      const ticket = { id: 1, title: 'Test', color: '#fff', date: '2024-01-01' }
      expect(isTicketPlanned(ticket)).toBe(true)
    })
    
    it('should return false for ticket without date', () => {
      const ticket = { id: 1, title: 'Test', color: '#fff', date: null }
      expect(isTicketPlanned(ticket)).toBe(false)
    })
  })
  
  describe('hasMultipleTechnicians', () => {
    it('should return true for ticket with multiple technicians', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        technicians: [
          { id: 1, name: 'Tech 1', color: '#123', is_primary: true },
          { id: 2, name: 'Tech 2', color: '#456', is_primary: false }
        ]
      }
      expect(hasMultipleTechnicians(ticket)).toBe(true)
    })
    
    it('should return false for ticket with one technician', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        technicians: [
          { id: 1, name: 'Tech 1', color: '#123', is_primary: true }
        ]
      }
      expect(hasMultipleTechnicians(ticket)).toBe(false)
    })
  })
  
  describe('isTechnicianAssigned', () => {
    it('should return true if technician_id matches', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        technician_id: 1
      }
      expect(isTechnicianAssigned(ticket, 1)).toBe(true)
    })
    
    it('should return true if technician is in array', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        technicians: [
          { id: 1, name: 'Tech 1', color: '#123', is_primary: true },
          { id: 2, name: 'Tech 2', color: '#456', is_primary: false }
        ]
      }
      expect(isTechnicianAssigned(ticket, 2)).toBe(true)
    })
    
    it('should return false if technician not assigned', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        technician_id: 1
      }
      expect(isTechnicianAssigned(ticket, 2)).toBe(false)
    })
  })
  
  describe('getSlotIndex', () => {
    it('should return correct slot index for valid times', () => {
      expect(getSlotIndex(7, 0)).toBe(0)
      expect(getSlotIndex(7, 15)).toBe(1)
      expect(getSlotIndex(7, 30)).toBe(2)
      expect(getSlotIndex(7, 45)).toBe(3)
      expect(getSlotIndex(8, 0)).toBe(4)
      expect(getSlotIndex(18, 45)).toBe(47)
    })
    
    it('should return -1 for invalid times', () => {
      expect(getSlotIndex(6, 0)).toBe(-1)
      expect(getSlotIndex(19, 0)).toBe(-1)
      expect(getSlotIndex(18, 50)).toBe(-1)
    })
  })
  
  describe('getTimeFromSlot', () => {
    it('should return correct time for slot index', () => {
      expect(getTimeFromSlot(0)).toEqual({ hour: 7, minutes: 0 })
      expect(getTimeFromSlot(1)).toEqual({ hour: 7, minutes: 15 })
      expect(getTimeFromSlot(4)).toEqual({ hour: 8, minutes: 0 })
      expect(getTimeFromSlot(47)).toEqual({ hour: 18, minutes: 45 })
    })
    
    it('should return default for invalid slot', () => {
      expect(getTimeFromSlot(-1)).toEqual({ hour: 7, minutes: 0 })
      expect(getTimeFromSlot(48)).toEqual({ hour: 7, minutes: 0 })
    })
  })
  
  describe('snapToQuarterHour', () => {
    it('should round to nearest quarter hour', () => {
      expect(snapToQuarterHour(0)).toBe(0)
      expect(snapToQuarterHour(7)).toBe(0)
      expect(snapToQuarterHour(8)).toBe(15)
      expect(snapToQuarterHour(22)).toBe(15)
      expect(snapToQuarterHour(23)).toBe(30)
      expect(snapToQuarterHour(37)).toBe(30)
      expect(snapToQuarterHour(38)).toBe(45)
      expect(snapToQuarterHour(52)).toBe(45)
      expect(snapToQuarterHour(53)).toBe(60)
    })
  })
  
  describe('getDurationSlots', () => {
    it('should calculate correct number of slots', () => {
      expect(getDurationSlots(15)).toBe(1)
      expect(getDurationSlots(30)).toBe(2)
      expect(getDurationSlots(45)).toBe(3)
      expect(getDurationSlots(60)).toBe(4)
      expect(getDurationSlots(90)).toBe(6)
    })
    
    it('should return 2 slots for invalid duration', () => {
      expect(getDurationSlots(0)).toBe(2)
      expect(getDurationSlots(10)).toBe(2)
    })
  })
  
  describe('formatDuration', () => {
    it('should format minutes correctly', () => {
      expect(formatDuration(15)).toBe('15 min')
      expect(formatDuration(30)).toBe('30 min')
      expect(formatDuration(45)).toBe('45 min')
    })
    
    it('should format hours correctly', () => {
      expect(formatDuration(60)).toBe('1 heure')
      expect(formatDuration(120)).toBe('2 heures')
      expect(formatDuration(180)).toBe('3 heures')
    })
    
    it('should format hours and minutes correctly', () => {
      expect(formatDuration(90)).toBe('1h 30min')
      expect(formatDuration(135)).toBe('2h 15min')
    })
    
    it('should handle null/undefined', () => {
      expect(formatDuration(0)).toBe('30 min')
    })
  })
  
  describe('canAddTechnician', () => {
    it('should not allow adding to unplanned ticket', () => {
      const ticket = { id: 1, title: 'Test', color: '#fff', date: null }
      const result = canAddTechnician(ticket, 1)
      
      expect(result.canAdd).toBe(false)
      expect(result.reason).toContain('planifié')
    })
    
    it('should not allow adding already assigned technician', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        date: '2024-01-01',
        technician_id: 1
      }
      const result = canAddTechnician(ticket, 1)
      
      expect(result.canAdd).toBe(false)
      expect(result.reason).toContain('déjà assigné')
    })
    
    it('should not allow more than 5 technicians', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        date: '2024-01-01',
        technicians: [
          { id: 1, name: 'T1', color: '#1', is_primary: true },
          { id: 2, name: 'T2', color: '#2', is_primary: false },
          { id: 3, name: 'T3', color: '#3', is_primary: false },
          { id: 4, name: 'T4', color: '#4', is_primary: false },
          { id: 5, name: 'T5', color: '#5', is_primary: false }
        ]
      }
      const result = canAddTechnician(ticket, 6)
      
      expect(result.canAdd).toBe(false)
      expect(result.reason).toContain('Maximum 5')
    })
    
    it('should allow adding valid technician', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        color: '#fff',
        date: '2024-01-01',
        technician_id: 1
      }
      const result = canAddTechnician(ticket, 2)
      
      expect(result.canAdd).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })
})