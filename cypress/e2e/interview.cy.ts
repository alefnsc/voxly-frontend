// describe('Interview Page Tests', () => {
//   beforeEach(() => {

//     cy.intercept('GET', '**/get-call/*', {
//       statusCode: 200,
//       body: { call_id: '12345' },
//     }).as('getCall');
//     cy.intercept('POST', '**/register-call', {
//       statusCode: 201,
//       body: { call_id: '12345' },
//     }).as('registerCall');
//     cy.intercept('GET', '**/start-call/*', {
//       statusCode: 200,
//     }).as('startCall');

//     const body = {
//       metadata: {
//         first_name: 'John',
//         job_title: 'Software Engineer',
//         company_name: 'Tech Company',
//         job_description: 'Software Engineer',
//         interviewee_cv: 'cv_link',
//       },
//     };
    
//     cy.visit('/interview', {
//       qs: {
//         call_id: '12345',
//         first_name: 'John Doe',
//         job_description: 'Software Engineer',
//       },
//       onBeforeLoad: (win) => {
//         // Definir o estado inicial no localStorage ou uma propriedade global
//         win.localStorage.setItem('initialState', JSON.stringify({ body }));
//       },
//     });

//   });

//   it('should open the modal and navigate to feedback when Quit button is clicked', () => {   
//     cy.wait('@registerCall', { timeout: 20000 });
//     cy.get('button').contains('Quit', { timeout: 10000 }).should('exist');

//     cy.get('button').contains('Quit', { timeout: 10000 }).click();
//     cy.get('.modal').should('be.visible');
//     cy.get('.modal').contains('Are you sure you want to quit?', { timeout: 10000 }).should('exist');

//     cy.get('.modal').contains('Quit', { timeout: 10000 }).click();

//     cy.url().should('include', '/feedback');

//   });

//   it('should not navigate to feedback if Cancel button is clicked in the modal', () => {
//     cy.get('button').contains('Quit').click();
//     cy.get('.modal').should('be.visible');

//     cy.get('.modal').contains('Cancel').click();

//     cy.get('.modal').should('not.exist');

//     cy.url().should('include', '/interview');
//   });

//   it('should show timer and agent speaking or listening', () => {
//     cy.get('.clock').should('exist');

//     cy.get('.flex').contains('Voxly is Speaking...').should('exist');
//   });
// });