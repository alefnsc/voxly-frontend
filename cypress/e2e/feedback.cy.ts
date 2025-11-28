describe('Feedback Component', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/get-feedback-for-interview/*', {
      statusCode: 200,
      body: { feedback: '\n## Summary\nThis is a summary of the feedback.\n## Score \n90/100' },
    }).as('getFeedback');

    cy.visit('/feedback?call_id=12345&first_name=John%20Doe&job_description=Software%20Engineer');
  });

  it('should display candidate name and job description correctly', () => {
    cy.wait('@getFeedback');

    cy.contains('Candidate Name:', { timeout: 20000 }).parent().find('div').should('contain.text', 'John Doe');
  });

  it('should display the feedback summary and score', () => {
    cy.wait('@getFeedback');
    cy.contains('This is a summary of the feedback', { timeout: 10000 });
  });

  it('should download the transcript as a PDF when the button is clicked', () => {
    cy.wait('@getFeedback');
    cy.contains('button', 'Download Transcript in PDF', { timeout: 20000 }).as('downloadButton');

    cy.get('@downloadButton').click();
    cy.window().then((win) => {
      const expectedFileName = 'feedback_report.pdf';
      cy.stub(win, 'open').callsFake((url, target, features) => {
        expect(url).to.include('.pdf');
        expect(url).to.include(expectedFileName);
      });
    });
    cy.wait(2000);
  });

  it('should navigate to the home page when retry button is clicked', () => {
    cy.contains('button', 'Retry Interview', { timeout: 10000 }).click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });
});