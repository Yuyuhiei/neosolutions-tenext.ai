// src/lib/hardcodedData.ts

// This file holds hardcoded data that simulates external data sources
// like a Knowledge Base or a database.
// In a real application, this data would be fetched from Supabase or other APIs.

// Hardcoded Knowledge Base Articles (Expanded)
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

// You could add other hardcoded data here later, e.g.,
// export const hardcodedCustomers = [...];
// export const hardcodedTickets = [...]; // If needed elsewhere, though currently in tickets/page.tsx
