describe('Home Page Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the home page with all fields and buttons', () => {
    cy.get('img[alt="Interview"]').should('exist'); // Imagem de fundo
    cy.get('h1').contains('Discovery').should('exist'); // Título principal
    cy.get('p').contains('This information will tailor interview experience to your scenario.').should('exist'); // Subtítulo

    // Verifique os campos de entrada
    cy.get('input[placeholder="First Name"]').should('exist');
    cy.get('input[placeholder="Last Name"]').should('exist');
    cy.get('input[placeholder="Company Name"]').should('exist');
    cy.get('input[placeholder="Job Title"]').should('exist');
    cy.get('textarea[placeholder="Job Description"]').should('exist');

    // Verifique o botão de upload de arquivo
    cy.get('label[for="file-upload"]').should('contain', 'Upload Resume');

    // Verifique a checkbox e o texto relacionado
    cy.get('#acceptPolicy').should('exist');
    cy.get('label[for="acceptPolicy"]').contains('I accept Privacy Policy and Terms of Use.').should('exist');

    // Verifique o botão "Start Interview"
    cy.get('button').contains('Start Interview').should('exist');
  });

  it('should allow filling the form and submitting it', () => {
    // Preencha os campos de entrada
    cy.get('input[placeholder="First Name"]').type('John');
    cy.get('input[placeholder="Last Name"]').type('Doe');
    cy.get('input[placeholder="Company Name"]').type('Tech Corp');
    cy.get('input[placeholder="Job Title"]').type('Software Engineer');
    cy.get('textarea[placeholder="Job Description"]')
    .type('Experienced in developing scalable applications.\n\nWhat We Do?\nMaker is an engagement platform built from the ground up to help deliver the richest, most compelling content for commerce. We help online retailers and brands enhance existing websites with compelling content, dramatically increasing engagement, conversion, and revenue growth.\nWe’ve combined the best of design, web-publishing, and analytics tools in a single platform that can enhance any existing site with 10x richer content with zero code, development cost, or risk.\nMarketers and designers use our software to create, source, publish & optimize interactive content for their product pages, landing pages, lookbooks, blog posts, user-generated stories, and more.\nOur customers include Walmart, Anthropologie, Rue21, and many others.\n\nWe are looking for developers with solid fundamentals in software development, systems, troubleshooting, sharp coding skills, and a passion for working on the latest technologies in a fast-paced environment.\nAs a backend developer, your job will be highly technical and hands-on.\nYou will also need to manage our infrastructure on Vercel, AWS, Fastly, and Cloudflare.\nOur stack is mostly Node.js (using Rescript) running on serverless functions.\n\nYour typical day-to-day will involve:\nTaking complete ownership of Maker\'s technology platform development including hands-on development, backend architecture, technical support, and technology strategy.\nExploring and evaluating new developments in tech that can benefit our products and platform, or the operational effectiveness of the software development team.\n\nRequirements\n8+ years as a writer of clean, readable, and maintainable code and tests\nexperience in building Node.js applications\nhave experience building APIs and integrating with third-party APIs\nhave worked on key functionality for a cloud-based product\nhave experience with test-driven development and unit testing\nexperience in software engineering and architecture\nexperience building at least two products from scratch, and then scaling them from 10X to 100X.\ngood communication skills\n\nNice to have\nhaving experience working on an internal product (an application or CMS) is a plus\nexperience working in a product-based startup is a plus');

  const filePath = 'sample.pdf'; // O arquivo deve estar na pasta cypress/fixtures
  cy.get('input[type="file"]').attachFile(filePath);

  cy.get('#acceptPolicy').click();

  cy.wait(1000)
  
  cy.get('#acceptPolicy')
    .should('have.attr', 'data-state', 'checked');

    // Submeta o formulário
    cy.contains('span', 'Start Interview')
    .closest('button')
    .click({ timeout: 90000 });

    // cy.wait(10000);

    // // Verifique o redirecionamento para a próxima página
    // cy.url({ timeout: 90000 }).should('include', 'interview'); // Ajuste conforme necessário
  });
});