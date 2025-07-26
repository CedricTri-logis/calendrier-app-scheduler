// Tests automatisés pour le système multi-techniciens

import { 
  normalizeTicket, 
  isTicketPlanned,
  hasMultipleTechnicians,
  isTechnicianAssigned,
  filterTicketsByTechnician,
  canAddTechnician,
  canRemoveTechnician,
  type Ticket,
  type Technician
} from '../utils/ticketHelpers'

// Configuration des tests
interface TestResult {
  name: string
  passed: boolean
  message?: string
}

class MultiTechnicianTestSuite {
  private results: TestResult[] = []
  
  // Données de test
  private techniciens: Technician[] = [
    { id: 1, name: 'Jean Dupont', color: '#3B82F6', active: true },
    { id: 2, name: 'Marie Martin', color: '#10B981', active: true },
    { id: 3, name: 'Pierre Durand', color: '#8B5CF6', active: true },
    { id: 4, name: 'Sophie Bernard', color: '#F59E0B', active: true },
    { id: 5, name: 'Non assigné', color: '#6B7280', active: true }
  ]
  
  private ticketSansDate: Ticket = {
    id: 1,
    title: 'Maintenance générale',
    color: '#FEF3C7',
    date: null,
    technician_id: null,
    technician_name: 'Non assigné',
    technician_color: '#6B7280',
    technicians: []
  }
  
  private ticketAvecUnTech: Ticket = {
    id: 2,
    title: 'Réparation climatisation',
    color: '#FEF3C7',
    date: '2024-01-15',
    technician_id: 1,
    technician_name: 'Jean Dupont',
    technician_color: '#3B82F6',
    technicians: [
      { ...this.techniciens[0], is_primary: true }
    ]
  }
  
  private ticketMultiTech: Ticket = {
    id: 3,
    title: 'Installation système',
    color: '#FEF3C7',
    date: '2024-01-16',
    technician_id: 1,
    technician_name: 'Jean Dupont',
    technician_color: '#3B82F6',
    technicians: [
      { ...this.techniciens[0], is_primary: true },
      { ...this.techniciens[1], is_primary: false },
      { ...this.techniciens[2], is_primary: false }
    ]
  }
  
  // Méthode principale pour exécuter tous les tests
  runAllTests(): void {
    console.log('🧪 Démarrage des tests du système multi-techniciens...\n')
    
    // Tests de normalisation
    this.testNormalizeTicket()
    
    // Tests des fonctions utilitaires
    this.testIsTicketPlanned()
    this.testHasMultipleTechnicians()
    this.testIsTechnicianAssigned()
    this.testFilterTicketsByTechnician()
    
    // Tests de validation
    this.testCanAddTechnician()
    this.testCanRemoveTechnician()
    
    // Tests d'intégration
    this.testCompleteScenarios()
    
    // Afficher les résultats
    this.displayResults()
  }
  
  // Test 1: Normalisation des tickets
  private testNormalizeTicket(): void {
    console.log('📋 Test de normalisation des tickets...')
    
    // Test 1.1: Ticket sans technicien
    const normalized1 = normalizeTicket({
      id: 1,
      title: 'Test',
      color: '#FFF'
    })
    this.addResult(
      'Normalisation ticket sans technicien',
      normalized1.technician_name === 'Non assigné' && normalized1.technicians.length === 0
    )
    
    // Test 1.2: Ticket avec ancien système
    const normalized2 = normalizeTicket({
      id: 2,
      title: 'Test 2',
      color: '#FFF',
      technician_id: 1,
      technician: { id: 1, name: 'Jean', color: '#00F', active: true }
    })
    this.addResult(
      'Normalisation ticket ancien système',
      normalized2.technicians.length === 1 && normalized2.technicians[0].is_primary === true
    )
    
    // Test 1.3: Ticket avec nouveau système
    const normalized3 = normalizeTicket({
      id: 3,
      title: 'Test 3',
      color: '#FFF',
      technicians: [
        { id: 1, name: 'Jean', color: '#00F', is_primary: true },
        { id: 2, name: 'Marie', color: '#0F0', is_primary: false }
      ]
    })
    this.addResult(
      'Normalisation ticket nouveau système',
      normalized3.technicians.length === 2 && 
      normalized3.technician_id === 1 &&
      normalized3.technician_name === 'Jean'
    )
  }
  
  // Test 2: Vérification si ticket planifié
  private testIsTicketPlanned(): void {
    console.log('📅 Test de vérification planification...')
    
    this.addResult(
      'Ticket sans date n\'est pas planifié',
      !isTicketPlanned(this.ticketSansDate)
    )
    
    this.addResult(
      'Ticket avec date est planifié',
      isTicketPlanned(this.ticketAvecUnTech)
    )
  }
  
  // Test 3: Vérification multi-techniciens
  private testHasMultipleTechnicians(): void {
    console.log('👥 Test de détection multi-techniciens...')
    
    this.addResult(
      'Ticket sans technicien',
      !hasMultipleTechnicians(this.ticketSansDate)
    )
    
    this.addResult(
      'Ticket avec un technicien',
      !hasMultipleTechnicians(this.ticketAvecUnTech)
    )
    
    this.addResult(
      'Ticket avec plusieurs techniciens',
      hasMultipleTechnicians(this.ticketMultiTech)
    )
  }
  
  // Test 4: Vérification assignation technicien
  private testIsTechnicianAssigned(): void {
    console.log('🔍 Test de vérification d\'assignation...')
    
    this.addResult(
      'Technicien non assigné',
      !isTechnicianAssigned(this.ticketMultiTech, 4)
    )
    
    this.addResult(
      'Technicien assigné (principal)',
      isTechnicianAssigned(this.ticketMultiTech, 1)
    )
    
    this.addResult(
      'Technicien assigné (secondaire)',
      isTechnicianAssigned(this.ticketMultiTech, 2)
    )
  }
  
  // Test 5: Filtrage par technicien
  private testFilterTicketsByTechnician(): void {
    console.log('🔧 Test de filtrage par technicien...')
    
    const tickets = [
      this.ticketSansDate,
      this.ticketAvecUnTech,
      this.ticketMultiTech
    ]
    
    // Pas de filtre
    const filtered1 = filterTicketsByTechnician(tickets, null)
    this.addResult(
      'Pas de filtre retourne tous les tickets',
      filtered1.length === 3
    )
    
    // Filtre Tech 1
    const filtered2 = filterTicketsByTechnician(tickets, 1)
    this.addResult(
      'Filtre Tech 1 retourne 2 tickets',
      filtered2.length === 2 && 
      filtered2.includes(this.ticketAvecUnTech) && 
      filtered2.includes(this.ticketMultiTech)
    )
    
    // Filtre Tech 2
    const filtered3 = filterTicketsByTechnician(tickets, 2)
    this.addResult(
      'Filtre Tech 2 retourne 1 ticket (multi)',
      filtered3.length === 1 && filtered3[0].id === 3
    )
    
    // Filtre Tech 4 (non assigné)
    const filtered4 = filterTicketsByTechnician(tickets, 4)
    this.addResult(
      'Filtre Tech 4 retourne 0 ticket',
      filtered4.length === 0
    )
  }
  
  // Test 6: Validation ajout technicien
  private testCanAddTechnician(): void {
    console.log('✅ Test de validation ajout technicien...')
    
    // Ticket non planifié
    const result1 = canAddTechnician(this.ticketSansDate, 1)
    this.addResult(
      'Impossible d\'ajouter à ticket non planifié',
      !result1.canAdd && result1.reason?.includes('planifié')
    )
    
    // Technicien déjà assigné
    const result2 = canAddTechnician(this.ticketMultiTech, 1)
    this.addResult(
      'Impossible d\'ajouter technicien déjà assigné',
      !result2.canAdd && result2.reason?.includes('déjà assigné')
    )
    
    // Ajout valide
    const result3 = canAddTechnician(this.ticketAvecUnTech, 2)
    this.addResult(
      'Ajout valide de nouveau technicien',
      result3.canAdd
    )
    
    // Test limite (5 techniciens max)
    const ticketMax: Ticket = {
      ...this.ticketMultiTech,
      technicians: [
        { id: 1, name: 'T1', color: '#F00', is_primary: true },
        { id: 2, name: 'T2', color: '#F00', is_primary: false },
        { id: 3, name: 'T3', color: '#F00', is_primary: false },
        { id: 4, name: 'T4', color: '#F00', is_primary: false },
        { id: 5, name: 'T5', color: '#F00', is_primary: false }
      ]
    }
    const result4 = canAddTechnician(ticketMax, 6)
    this.addResult(
      'Limite de 5 techniciens respectée',
      !result4.canAdd && result4.reason?.includes('Maximum')
    )
  }
  
  // Test 7: Validation retrait technicien
  private testCanRemoveTechnician(): void {
    console.log('❌ Test de validation retrait technicien...')
    
    // Ticket planifié
    const result1 = canRemoveTechnician(this.ticketMultiTech, 2)
    this.addResult(
      'Impossible de retirer sur ticket planifié',
      !result1.canRemove && result1.reason?.includes('calendrier')
    )
    
    // Ticket non planifié avec un seul technicien
    const ticketUnSeul: Ticket = {
      ...this.ticketAvecUnTech,
      date: null
    }
    const result2 = canRemoveTechnician(ticketUnSeul, 1)
    this.addResult(
      'Impossible de retirer le seul technicien',
      !result2.canRemove && result2.reason?.includes('seul technicien')
    )
    
    // Retrait valide
    const ticketNonPlanifie: Ticket = {
      ...this.ticketMultiTech,
      date: null
    }
    const result3 = canRemoveTechnician(ticketNonPlanifie, 2)
    this.addResult(
      'Retrait valide sur ticket non planifié multi-tech',
      result3.canRemove
    )
    
    // Technicien non assigné
    const result4 = canRemoveTechnician(ticketNonPlanifie, 5)
    this.addResult(
      'Impossible de retirer technicien non assigné',
      !result4.canRemove && result4.reason?.includes('pas assigné')
    )
  }
  
  // Test 8: Scénarios complets
  private testCompleteScenarios(): void {
    console.log('🎯 Test de scénarios complets...')
    
    // Scénario 1: Workflow complet d'ajout
    let ticket: Ticket = {
      id: 10,
      title: 'Nouveau ticket',
      color: '#FEF3C7',
      date: null,
      technician_id: 1,
      technician_name: 'Jean Dupont',
      technician_color: '#3B82F6',
      technicians: [{ ...this.techniciens[0], is_primary: true }]
    }
    
    // 1. Planifier le ticket
    ticket.date = '2024-01-20'
    
    // 2. Vérifier qu'on peut ajouter un technicien
    const canAdd = canAddTechnician(ticket, 2)
    
    // 3. Ajouter le technicien
    if (canAdd.canAdd) {
      ticket.technicians.push({ ...this.techniciens[1], is_primary: false })
    }
    
    this.addResult(
      'Scénario ajout de technicien complet',
      hasMultipleTechnicians(ticket) && ticket.technicians.length === 2
    )
    
    // Scénario 2: Workflow de retrait
    // 1. Déplanifier le ticket
    ticket.date = null
    
    // 2. Vérifier qu'on peut retirer
    const canRemove = canRemoveTechnician(ticket, 2)
    
    // 3. Retirer le technicien
    if (canRemove.canRemove) {
      ticket.technicians = ticket.technicians.filter(t => t.id !== 2)
    }
    
    this.addResult(
      'Scénario retrait de technicien complet',
      !hasMultipleTechnicians(ticket) && ticket.technicians.length === 1
    )
  }
  
  // Méthodes utilitaires
  private addResult(name: string, passed: boolean, message?: string): void {
    this.results.push({ name, passed, message })
  }
  
  private displayResults(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSULTATS DES TESTS')
    console.log('='.repeat(60) + '\n')
    
    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const percentage = Math.round((passed / total) * 100)
    
    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.name}`)
      if (result.message) {
        console.log(`   → ${result.message}`)
      }
    })
    
    console.log('\n' + '-'.repeat(60))
    console.log(`TOTAL: ${passed}/${total} tests passés (${percentage}%)`)
    console.log('-'.repeat(60) + '\n')
    
    if (passed === total) {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS! Le système est fonctionnel.')
    } else {
      console.log('⚠️  Certains tests ont échoué. Vérifier les erreurs ci-dessus.')
    }
  }
}

// Exécuter les tests
if (typeof window !== 'undefined') {
  // Dans le navigateur
  (window as any).runMultiTechnicianTests = () => {
    const suite = new MultiTechnicianTestSuite()
    suite.runAllTests()
  }
} else {
  // Dans Node.js
  const suite = new MultiTechnicianTestSuite()
  suite.runAllTests()
}

export { MultiTechnicianTestSuite }