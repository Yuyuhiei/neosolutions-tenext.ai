// src/lib/hardcodedData.ts

/**
 * @module hardcodedData
 * @description This file contains hardcoded data simulating external data sources
 * like a Knowledge Base, Departments/Agents, and Customer Tickets.
 * In a real application, this data would typically be fetched from a database (e.g., Supabase) or external APIs.
 */

/**
 * @typedef {Object} KnowledgeBaseArticle
 * @property {string} id - Unique identifier for the article (e.g., 'KB001').
 * @property {string} title - The title of the knowledge base article.
 * @property {string} content - The main content or body of the article.
 */

/**
 * @constant {KnowledgeBaseArticle[]} hardcodedKnowledgeBase
 * @description An array of hardcoded objects simulating knowledge base articles.
 */
export const hardcodedKnowledgeBase = [
    { id: 'KB001', title: 'How to Reset Your Password', content: 'Steps to reset a user\'s forgotten password include navigating to the login page, clicking "Forgot Password", and following the email link sent to their registered email address. Ensure you check your spam folder if the email is not received immediately.' },
    { id: 'KB002', title: 'Troubleshooting Login Errors', content: 'Common login errors and solutions: 1. Incorrect username/password (verify caps lock). 2. Account locked (wait 15 minutes or contact support). 3. Browser cache/cookies (clear browser data). 4. Network issues (check internet connection).' },
    { id: 'KB003', title: 'Understanding Your Billing Cycle', content: 'Billing cycles run from the 1st to the last day of each month. Invoices are generated on the 1st and payment is due within 15 days. You can view your current and past invoices in your account dashboard under the "Billing" section.' },
    { id: 'KB004', title: 'Updating Payment Information', content: 'To update credit card or billing address details, log in to your account, navigate to "Account Settings", then "Payment Methods". You can add a new card or edit existing information here. Changes will apply to your next billing cycle.' },
    { id: 'KB005', title: 'Submitting a Feature Request', content: 'We welcome your feedback! To submit a new product feature request, please use the "Submit Feedback" form in the help center or contact our support team via email with a detailed description of the feature you need and why it would be valuable.' },
    { id: 'KB006', title: 'Checking Refund Status', content: 'Refund requests are typically processed within 5-7 business days. You can check the status of your refund by contacting our billing department with your order number or original ticket ID. You will receive an email notification once the refund is processed.' },
    { id: 'KB007', title: 'Contacting Support Channels', content: 'You can reach our support team via email (support@example.com), live chat on our website (available M-F, 9 AM - 5 PM PST), or by calling our support line at 1-800-EX-AMPLE.' },
    { id: 'KB008', title: 'Service Level Agreement (SLA)', content: 'Our standard SLA guarantees a first response time within 4 business hours for high-priority tickets and 24 business hours for medium/low priority tickets. Resolution times vary based on complexity.' },
    { id: 'KB009', title: 'Supported Browsers', content: 'Our application is best viewed on the latest versions of Chrome, Firefox, Safari, and Edge. Compatibility issues may occur with older browser versions.' },
    { id: 'KB010', title: 'Account Verification Process', content: 'To verify your account for certain actions (like changing email or password), you may be asked to provide information like your account creation date, recent activity, or answer security questions.' },
];

/**
 * @typedef {Object} Department
 * @property {string} name - The name of the department.
 * @property {string[]} agents - An array of agent names assigned to this department.
 * @property {string} description - A brief description of the department's responsibilities.
 */

/**
 * @constant {Department[]} hardcodedDepartments
 * @description An array of hardcoded objects simulating support departments and their agents.
 */
export const hardcodedDepartments = [
    { name: 'Technical Support', agents: ['Agent A', 'Agent C', 'Agent E'], description: 'Handles login issues, app errors, website problems, and technical troubleshooting.' },
    { name: 'Billing Department', agents: ['Agent B', 'Agent D'], description: 'Manages billing inquiries, payment issues, refunds, and subscription questions.' },
    { name: 'Feature Requests', agents: ['Product Team'], description: 'Processes new feature suggestions and product feedback.' },
    { name: 'Customer Relations', agents: ['Agent F'], description: 'Deals with complaints, escalations, and general customer feedback.' },
    // Add more departments/agents as needed
];

/**
 * @typedef {Object} CustomerTicket
 * @property {string} ticketId - Unique identifier for the ticket (e.g., 'TCKT-1001').
 * @property {string} name - The name of the customer who submitted the ticket.
 * @property {string} email - The email address of the customer.
 * @property {string} phone - The phone number of the customer.
 * @property {number} tier - The support tier level for the ticket (e.g., 0, 1, 2, 3, 4).
 * @property {string} product - The product related to the ticket (e.g., 'Mobile App', 'Web Dashboard').
 * @property {string} issueSummary - A brief summary of the customer's issue.
 * @property {string} dateSubmitted - The date the ticket was submitted (YYYY-MM-DD format).
 * @property {string} notes - Any additional notes related to the ticket.
 */

/**
 * @constant {CustomerTicket[]} hardcodedTickets
 * @description An array of hardcoded objects simulating customer support tickets.
 */
export const hardcodedTickets = [
    { ticketId: 'TCKT-1001', name: 'Alice Mendoza', email: 'alice.m@example.com', phone: '9171234567', tier: 1, product: 'Mobile App', issueSummary: 'App crashes after login', dateSubmitted: '2025-05-10', notes: 'First-time report' },
    { ticketId: 'TCKT-1002', name: 'Bryan Lee', email: 'bryan.lee@example.com', phone: '9181234567', tier: 2, product: 'Web Dashboard', issueSummary: 'Missing data in analytics tab', dateSubmitted: '2025-05-10', notes: '' },
    { ticketId: 'TCKT-1003', name: 'Carla Rivera', email: 'carla.r@example.com', phone: '9192223334', tier: 0, product: 'Billing Portal', issueSummary: "Can't update payment method", dateSubmitted: '2025-05-11', notes: 'Tier 0 - redirected to self-help' },
    { ticketId: 'TCKT-1004', name: 'David Cruz', email: 'davidc@example.net', phone: '9193455678', tier: 3, product: 'Cloud Storage', issueSummary: 'Files disappeared from shared folder', dateSubmitted: '2025-05-11', notes: 'Escalated' },
    { ticketId: 'TCKT-1005', name: 'Emma Santos', email: 'emma.s@example.com', phone: '9213456789', tier: 1, product: 'Web App', issueSummary: 'CAPTCHA not loading on login', dateSubmitted: '2025-05-12', notes: '' },
    { ticketId: 'TCKT-1006', name: 'Bryan Lee', email: 'bryan.lee@example.com', phone: '9181234567', tier: 2, product: 'Web Dashboard', issueSummary: 'Still missing analytics after update', dateSubmitted: '2025-05-12', notes: 'Follow-up to TCKT-1002' },
    { ticketId: 'TCKT-1007', name: 'Fiona Tan', email: 'fiona.t@example.org', phone: '9224345678', tier: 4, product: 'Enterprise API', issueSummary: 'Authentication tokens keep expiring', dateSubmitted: '2025-05-12', notes: 'Tier 4 – SLA in place' },
    { ticketId: 'TCKT-1008', name: 'George Lim', email: 'george.lim@example.com', phone: '9233456781', tier: 0, product: 'Mobile App', issueSummary: 'Forgot password – no reset email', dateSubmitted: '2025-05-12', notes: 'Resolved via FAQ' },
    { ticketId: 'TCKT-1009', name: 'Hannah Yu', email: 'hannahy@example.net', phone: '9241234567', tier: 1, product: 'Billing Portal', issueSummary: 'Charged twice for subscription', dateSubmitted: '2025-05-13', notes: '' },
    { ticketId: 'TCKT-1010', name: 'Isaac Villanueva', email: 'isaacv@example.org', phone: '9254567891', tier: 2, product: 'Web App', issueSummary: 'Error 403 when submitting form', dateSubmitted: '2025-05-13', notes: '' },
    { ticketId: 'TCKT-1011', name: 'Carla Rivera', email: 'carla.r@example.com', phone: '9192223334', tier: 0, product: 'Billing Portal', issueSummary: 'Payment method still invalid', dateSubmitted: '2025-05-13', notes: 'Repeat of TCKT-1003' },
    { ticketId: 'TCKT-1012', name: 'Jack Ong', email: 'jack.ong@example.com', phone: '9261234567', tier: 3, product: 'Cloud Storage', issueSummary: 'Shared links aren’t working', dateSubmitted: '2025-05-13', notes: 'High-priority client' },
    { ticketId: 'TCKT-1013', name: 'Alice Mendoza', email: 'alice.m@example.com', phone: '9171234567', tier: 1, product: 'Mobile App', issueSummary: 'Now seeing black screen after login', dateSubmitted: '2025-05-14', notes: 'Follow-up to TCKT-1001' },
    { ticketId: 'TCKT-1014', name: 'Kyle Enriquez', email: 'kyle.e@example.net', phone: '9272345678', tier: 1, product: 'Web Dashboard', issueSummary: 'Can\'t export CSV reports', dateSubmitted: '2025-05-14', notes: '' },
    { ticketId: 'TCKT-1015', name: 'Luis Martinez', email: 'luis.m@example.com', phone: '9281234567', tier: 2, product: 'Billing Portal', issueSummary: 'Wrong invoice address', dateSubmitted: '2025-05-14', notes: '' },
    { ticketId: 'TCKT-1016', name: 'Fiona Tan', email: 'fiona.t@example.org', phone: '9224345678', tier: 4, product: 'Enterprise API', issueSummary: 'Audit log endpoint failing intermittently', dateSubmitted: '2025-05-14', notes: 'Ongoing Tier 4 issue' },
    { ticketId: 'TCKT-1017', name: 'Hannah Yu', email: 'hannahy@example.net', phone: '9241234567', tier: 1, product: 'Billing Portal', issueSummary: 'Refund not reflected after 48 hrs', dateSubmitted: '2025-05-15', notes: 'Follow-up to TCKT-1009' },
    { ticketId: 'TCKT-1018', name: 'Mark De Leon', email: 'mark.d@example.com', phone: '9293456781', tier: 0, product: 'Mobile App', issueSummary: 'Account locked after failed logins', dateSubmitted: '2025-05-15', notes: '' },
    { ticketId: 'TCKT-1019', name: 'Emma Santos', email: 'emma.s@example.com', phone: '9213456789', tier: 1, product: 'Web App', issueSummary: 'Images won’t load on dashboard', dateSubmitted: '2025-05-15', notes: 'New issue' },
    { ticketId: 'TCKT-1020', name: 'Bryan Lee', email: 'bryan.lee@example.com', phone: '9181234567', tier: 2, product: 'Web Dashboard', issueSummary: 'Data mismatch between users and chart', dateSubmitted: '2025-05-16', notes: 'Third ticket from same customer' },
];
