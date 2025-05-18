'use client';
/**
 * @module TicketManagementPage
 * @description This component provides a Kanban-style interface for managing customer support tickets,
 * integrating with Google Gemini for AI-powered assistance features like summarization,
 * response suggestions, knowledge base lookup, and automated ticket assignment.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
// Import React hooks: useState for state management, useMemo for memoization,
// useEffect for side effects, useRef for mutable references.

import { PlusCircle, Filter, ArrowUpDown, XCircle, Send, Eraser, Mic, Phone, AlertTriangle, Merge } from 'lucide-react';
// Import icons from lucide-react library for various UI elements.

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
// Import necessary classes from the Google Generative AI library.

import { hardcodedKnowledgeBase, hardcodedDepartments } from '../lib/hardcodedData';
// Import hardcoded data arrays representing a knowledge base and departments with agents.


/**
 * @constant {string} apiKey
 * @description The API key for accessing the Google Generative AI API.
 * NOTE: This should ideally be loaded from an environment variable in a real application.
 */
const apiKey = "AIzaSyC1NaNuNzIATe-tlPbO53P7S08_nIT4ZrM"; // Replace with your actual API key

if (!apiKey) {
    console.error("NEXT_PUBLIC_GOOGLE_API_KEY environment variable not set. Gemini calls will not work.");
}

/**
 * @constant {GoogleGenerativeAI | null} genAI
 * @description The initialized Google Generative AI client instance, or null if the API key is missing.
 */
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * @constant {GenerativeModel | null} model
 * @description The generative model instance ('gemini-1.5-flash') obtained from the client,
 * or null if the client could not be initialized.
 */
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null; // Using gemini-1.5-flash

/**
 * @function formatKnowledgeBase
 * @description Formats an array of knowledge base articles into a string for use in AI prompts.
 * @param {typeof hardcodedKnowledgeBase} kb - The array of knowledge base articles.
 * @returns {string} A formatted string representation of the knowledge base.
 */
const formatKnowledgeBase = (kb: typeof hardcodedKnowledgeBase) => {
    if (!kb || kb.length === 0) return "No knowledge base articles available.";
    return kb.map(article => `## ${article.title}\n${article.content}`).join('\n\n');
};

/**
 * @constant {string} formattedKB
 * @description A formatted string containing all hardcoded knowledge base articles.
 */
const formattedKB = formatKnowledgeBase(hardcodedKnowledgeBase);

/**
 * @function formatDepartmentsForPrompt
 * @description Formats an array of departments and their agents into a string for use in AI prompts.
 * @param {typeof hardcodedDepartments} departments - The array of department objects.
 * @returns {string} A formatted string representation of departments and agents.
 */
const formatDepartmentsForPrompt = (departments: typeof hardcodedDepartments) => {
     if (!departments || departments.length === 0) return "No departments available.";
     return departments.map(dept =>
         `Department: ${dept.name}\nAgents: ${dept.agents.join(', ')}\nDescription: ${dept.description}`
     ).join('\n\n');
};

/**
 * @constant {string} formattedDepartments
 * @description A formatted string containing department and agent information for AI prompts.
 */
const formattedDepartments = formatDepartmentsForPrompt(hardcodedDepartments);


/**
 * @global
 * @description Declares the existence of Web Speech Recognition API interfaces on the `window` object.
 */
declare global {
    interface Window {
        webkitSpeechRecognition: any; // For Chrome/Safari
        SpeechRecognition: any; // Standard
    }
}


/**
 * @interface Message
 * @description Defines the structure of a single message within a ticket conversation.
 * @property {'Customer' | 'Agent'} sender - The sender of the message.
 * @property {string} text - The content of the message.
 * @property {string} timestamp - The ISO date string when the message was sent.
 */
interface Message {
    sender: 'Customer' | 'Agent';
    text: string;
    timestamp: string; // ISO date string
}

/**
 * @interface Ticket
 * @description Defines the structure of a customer support ticket.
 * @property {string} id - Unique identifier for the ticket.
 * @property {string} subject - The subject or title of the ticket.
 * @property {'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed'} status - The current status of the ticket.
 * @property {'Low' | 'Medium' | 'High' | 'Urgent'} priority - The priority level of the ticket.
 * @property {string | null} assignedTo - The agent or team assigned to the ticket, or null if unassigned.
 * @property {string} department - The department responsible for the ticket.
 * @property {'Phone' | 'Email' | 'Chat' | 'Web Form' | 'Social Media' | 'Other'} channel - The communication channel through which the ticket was created.
 * @property {string} createdAt - The ISO date string when the ticket was created.
 * @property {string} updatedAt - The ISO date string when the ticket was last updated.
 * @property {string} lastMessageAt - The ISO date string of the last message in the conversation.
 * @property {string} [description] - A detailed description of the customer's issue (optional).
 * @property {string} [publicNotes] - Notes visible to the customer (optional).
 * @property {string} [privateNotes] - Internal notes for agents (optional).
 * @property {Message[]} [conversation] - An array of messages representing the conversation history (optional).
 * @property {'Within SLA' | 'Approaching SLA' | 'Breached SLA'} [slaStatus] - The current status relative to the Service Level Agreement (optional).
 * @property {'None' | 'Level 1' | 'Level 2' | 'Level 3'} [escalationLevel] - The current escalation level (optional).
 * @property {string | null} [mergedInto] - The ID of the ticket this one was merged into, or null (optional).
 */
interface Ticket {
  id: string;
  subject: string;
  status: 'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string | null;
  department: string; // ADDED: Department field
  channel: 'Phone' | 'Email' | 'Chat' | 'Web Form' | 'Social Media' | 'Other';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastMessageAt: string; // ISO date string
  description?: string; // Added description field for detail view
  publicNotes?: string; // ADDED: Public notes field
  privateNotes?: string; // ADDED: Private notes field
  conversation?: Message[]; // ADDED: Conversation history
  slaStatus?: 'Within SLA' | 'Approaching SLA' | 'Breached SLA'; // ADDED: SLA Status
  escalationLevel?: 'None' | 'Level 1' | 'Level 2' | 'Level 3'; // ADDED: Escalation Level
  mergedInto?: string | null; // ADDED: ID of the ticket this one was merged into
}

/**
 * @constant {Object[]} hardcodedInteractionHistory
 * @description An array of hardcoded objects simulating historical interactions (emails, calls, notes)
 * for demonstration purposes. This is distinct from the ticket conversation history.
 */
const hardcodedInteractionHistory = [
    { id: 1, type: 'Email Received', timestamp: '2023-10-26T10:00:00Z', summary: 'Customer reported login issue.' },
    { id: 2, type: 'Agent Note', timestamp: '2023-10-26T10:15:00Z', summary: 'Checked account status, no lockouts found.' },
    { id: 3, type: 'Email Sent', timestamp: '2023-10-26T10:30:00Z', summary: 'Sent password reset instructions.' },
     { id: 4, type: 'Phone Call', timestamp: '2023-10-26T11:00:00Z', summary: 'Follow-up call from customer, still unable to login.' },
     { id: 5, type: 'Agent Note', timestamp: '2023-10-26T11:10:00Z', summary: 'Advised customer to clear browser cache.' },
    // Add more sample history entries as needed
];

/**
 * @function formatHistoryDate
 * @description Formats an ISO date string into a locale-specific date and time string.
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} The formatted date and time string.
 */
const formatHistoryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

/**
 * @function getDepartmentFromAssignment
 * @description Extracts the department name from a string in the format "Department - Agent Name".
 * @param {string | null} assignedTo - The assignedTo string or null.
 * @returns {string} The extracted department name, or 'Unassigned' if null or not parseable.
 */
const getDepartmentFromAssignment = (assignedTo: string | null): string => {
    if (!assignedTo) return 'Unassigned';
    const parts = assignedTo.split(' - ');
    return parts[0].trim() || 'Unassigned';
};

/**
 * @function isTicketRelated
 * @description Performs a simple check to see if two tickets are related based on keywords in their subjects.
 * In a real application, this would use more sophisticated methods.
 * @param {Ticket} ticket1 - The first ticket object.
 * @param {Ticket} ticket2 - The second ticket object.
 * @returns {boolean} True if the tickets are considered related based on keywords, false otherwise.
 */
const isTicketRelated = (ticket1: Ticket, ticket2: Ticket): boolean => {
    // A simple check: if subjects contain similar keywords (case-insensitive)
    // In a real application, you'd use more advanced text similarity or tagging.
    if (!ticket1.subject || !ticket2.subject) return false;

    const subject1 = ticket1.subject.toLowerCase();
    const subject2 = ticket2.subject.toLowerCase();
    // Check for overlap of significant terms
    const significantTerms = ['login', 'account', 'access', 'password', 'issue', 'problem', 'cannot', 'can\'t'];
     // Add more relevant terms
     return significantTerms.some(term => subject1.includes(term) && subject2.includes(term));
};

/**
 * @constant {Ticket[]} initialTickets
 * @description An array of hardcoded objects representing the initial set of customer support tickets.
 */
const initialTickets: Ticket[] = [
  {
    id: 'T001',
    subject: 'Cannot log in to account',
    status: 'Open',
    priority: 'Urgent',
    assignedTo: 'Technical Support - Agent A',
    department: 'Technical Support', // ADDED
    channel: 'Web Form',
    createdAt: '2023-10-26T10:00:00Z',
    updatedAt: '2023-10-26T10:30:00Z',
    lastMessageAt: '2023-10-26T10:30:00Z',
    description: 'Customer is unable to access their account after multiple attempts. They have verified their username and password.',
    conversation: [ // ADDED: Sample conversation for T001
        { sender: 'Customer', text: 'I cannot log in to my account.', timestamp: '2023-10-26T10:00:00Z' },
        { sender: 'Agent', text: 'Hello, I understand you are having trouble logging in. Can you please provide your username?', timestamp: '2023-10-26T10:10:00Z' },
        { sender: 'Customer', text: 'My username is user123.', timestamp: '2023-10-26T10:15:00Z' },
    ],
    publicNotes: 'Customer is very frustrated.', // ADDED Sample Note
    privateNotes: 'Need to escalate if password reset fails again.', // ADDED Sample Note
    slaStatus: 'Approaching SLA', // ADDED Sample SLA Status
    escalationLevel: 'None', // ADDED Sample Escalation Level
  },
  {
    id: 'T002',
    subject: 'Question about billing cycle',
    status: 'New',
    priority: 'Medium',
    assignedTo: 'Billing - Agent B',
    department: 'Billing', // ADDED
    channel: 'Email',
    createdAt: '2023-10-26T11:15:00Z',
    updatedAt: '2023-10-26T11:15:00Z',
    lastMessageAt: '2023-10-26T11:15:00Z',
    description: 'Customer is asking when their next billing cycle begins and how much the charge will be.',
    conversation: [ // ADDED: Sample conversation for T002
         { sender: 'Customer', text: 'When is my next billing cycle?', timestamp: '2023-10-26T11:15:00Z' },
    ],
     publicNotes: '',
    privateNotes: 'Check billing system for exact date.',
    slaStatus: 'Within SLA', // ADDED Sample SLA Status
    escalationLevel: 'None', // ADDED Sample Escalation Level
  },
   {
     id: 'T003',
    subject: 'Product feature request',
    status: 'Open',
    priority: 'Low',
    assignedTo: 'Product Team - Agent C',
    department: 'Product Team', // ADDED
    channel: 'Chat',
    createdAt: '2023-10-26T09:30:00Z',
    updatedAt: '2023-10-26T14:00:00Z',
    lastMessageAt: '2023-10-26T14:00:00Z',
    description: 'Customer would like to request a new feature for the product, specifically the ability to export data in a different format.',
    conversation: [], // Empty conversation initially
     publicNotes: 'Forward to product team.',
    privateNotes: '',
    slaStatus: 'Within SLA', // ADDED Sample SLA Status
    escalationLevel: 'None', // ADDED Sample Escalation Level
  },
   {
    id: 'T004',
    subject: 'Complaint about service',
    status: 'Pending',
    priority: 'High',
    assignedTo: 'Technical Support - Agent A',
     department: 'Technical Support', // ADDED
    channel: 'Phone', // Simulating a phone ticket received as hardcoded text initially
    createdAt: '2023-10-25T16:00:00Z',
    updatedAt: '2023-10-26T09:00:00Z',
    lastMessageAt: '2023-10-26T09:00:00Z',
    description: 'Customer is unhappy with the response time on a previous ticket and is requesting escalation.',
    conversation: [], // Empty conversation initially
     publicNotes: '',
    privateNotes: 'Agent A needs to call customer directly.',
    slaStatus: 'Breached SLA', // ADDED Sample SLA Status
    escalationLevel: 'Level 1', // ADDED Sample Escalation Level
  },
   {
    id: 'T005',
    subject: 'Follow up on T001 - Still cannot log in', // MODIFIED Subject for relatedness
    status: 'New', // Simulating a follow-up coming in as new
    priority: 'Urgent', // Duplicates of high priority are urgent
    assignedTo: 'Technical Support - Agent D', // Assigned to a different agent in the same department
    department: 'Technical Support', // ADDED
    channel: 'Email',
    createdAt: '2023-10-26T15:00:00Z',
    updatedAt: '2023-10-26T15:00:00Z',
    lastMessageAt: '2023-10-26T15:00:00Z',
    description: 'Customer is following up on ticket T001 regarding their login issue. Still unable to access account.',
    conversation: [], // Empty conversation initially
    publicNotes: '',
    privateNotes: '',
    slaStatus: 'Within SLA', // ADDED Sample SLA Status
    escalationLevel: 'None', // ADDED Sample Escalation Level
  },
    {
    id: 'T006',
    subject: 'Issue with payment processing',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Billing - Agent E',
    department: 'Billing', // ADDED
    channel: 'Chat',
    createdAt: '2023-10-26T12:00:00Z',
    updatedAt: '2023-10-26T13:00:00Z',
    lastMessageAt: '2023-10-26T13:00:00Z',
    description: 'Customer reported an error while trying to complete a payment online. Transaction failed.',
    conversation: [], // Empty conversation initially
     publicNotes: '',
    privateNotes: '',
    slaStatus: 'Within SLA', // ADDED Sample SLA Status
    escalationLevel: 'None', // ADDED Sample Escalation Level
  },
   {
    id: 'T007',
    subject: 'Request for refund status',
    status: 'Resolved',
    priority: 'Medium',
    assignedTo: 'Billing - Agent B',
    department: 'Billing', // ADDED
    channel: 'Email',
    createdAt: '2025-05-16T10:00:00Z', // Updated date for testing
    updatedAt: '2025-05-17T11:00:00Z', // Updated date for testing
    lastMessageAt: '2025-05-17T11:00:00Z', // Updated date for testing
    description: 'Customer is inquiring about the status of their refund request submitted last week.',
    conversation: [], // Empty conversation initially
     publicNotes: '',
    privateNotes: '',
    slaStatus: 'Within SLA', // ADDED Sample SLA Status
    escalationLevel: 'None', // ADDED Sample Escalation Level
  },
    // ADDED: More tickets related to login issues for demonstration
    {
         id: 'T008',
        subject: 'Cannot access my account after password reset',
        status: 'New',
        priority: 'High',
        assignedTo: 'Technical Support - Agent A',
        department: 'Technical Support', // ADDED
        channel: 'Web Form',
        createdAt: '2023-10-27T09:00:00Z',
        updatedAt: '2023-10-27T09:00:00Z',
        lastMessageAt: '2023-10-27T09:00:00Z',
        description: 'After resetting my password, I am still unable to log in. Getting an invalid credentials error.',
        conversation: [],
        publicNotes: '',
        privateNotes: '',
        slaStatus: 'Within SLA',
        escalationLevel: 'None',
    },
     {
        id: 'T009',
        subject: 'Login failed repeatedly',
        status: 'Open',
        priority: 'Urgent',
        assignedTo: 'Technical Support - Agent D',
        department: 'Technical Support', // ADDED
        channel: 'Chat',
        createdAt: '2023-10-27T10:30:00Z',
        updatedAt: '2023-10-27T11:00:00Z',
        lastMessageAt: '2023-10-27T11:00:00Z',
        description: 'My account seems locked after multiple failed login attempts. Please unlock it.',
        conversation: [],
        publicNotes: 'Account lockout suspected.',
        privateNotes: 'Check user account status in admin panel.',
        slaStatus: 'Approaching SLA',
        escalationLevel: 'None',
    },
     {
        id: 'T010',
        subject: 'Cannot log in on mobile app',
        status: 'New',
        priority: 'Medium',
        assignedTo: 'Mobile Support - Agent F', // Assigned to a different department
        department: 'Mobile Support', // ADDED
        channel: 'Email',
        createdAt: '2023-10-27T11:00:00Z',
        updatedAt: '2023-10-27T11:00:00Z',
        lastMessageAt: '2023-10-27T11:00:00Z',
        description: 'The mobile application is not allowing me to log in, but the website works fine.',
        conversation: [],
        publicNotes: '',
        privateNotes: 'Check app version and user device details.',
        slaStatus: 'Within SLA',
        escalationLevel: 'None',
    },
];

/**
 * @constant {Record<Ticket['status'], string>} statusColors
 * @description Maps ticket statuses to Tailwind CSS background and text color classes.
 */
const statusColors: Record<Ticket['status'], string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Open': 'bg-green-100 text-green-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Pending': 'bg-orange-100 text-orange-800',
  'Resolved': 'bg-teal-100 text-teal-800',
  'Closed': 'bg-gray-200 text-gray-800',
};

/**
 * @constant {Record<Ticket['priority'], string>} priorityColors
 * @description Maps ticket priorities to Tailwind CSS text color and font weight classes.
 */
const priorityColors: Record<Ticket['priority'], string> = {
  'Low': 'text-green-600 font-medium',
  'Medium': 'text-yellow-600 font-semibold', // Changed Medium to semibold for better distinction
  'High': 'text-orange-600 font-bold', // Changed High to bold
  'Urgent': 'text-red-600 font-extrabold', // Changed Urgent to extrabold
};

/**
 * @constant {Record<NonNullable<Ticket['slaStatus']>, string>} slaColors
 * @description Maps SLA statuses to Tailwind CSS text color classes.
 */
const slaColors: Record<NonNullable<Ticket['slaStatus']>, string> = {
    'Within SLA': 'text-green-600',
    'Approaching SLA': 'text-yellow-600',
    'Breached SLA': 'text-red-600',
};

/**
 * @constant {Ticket['status'][]} kanbanStatuses
 * @description Defines the ordered list of ticket statuses used to create the Kanban columns.
 */
const kanbanStatuses: Ticket['status'][] = ['New', 'Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

/**
 * @function addNewHardcodedTicket
 * @description Simulates adding a new hardcoded ticket to the state, potentially with AI-based department/agent assignment.
 * In a real application, this would interact with a backend API.
 * @param {React.Dispatch<React.SetStateAction<Ticket[]>>} setTickets - The state setter function for tickets.
 * @param {GenerativeModel | null} model - The GenerativeModel instance for AI assignment, or null.
 * @param {string} [initialConcern='Automated transcription: Customer called with a general inquiry.'] - The initial customer concern text.
 * @async
 */
const addNewHardcodedTicket = async (setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>, model: GenerativeModel | null, initialConcern: string = 'Automated transcription: Customer called with a general inquiry.') => {
    // ...
     // Generate a more robust unique ID for demo purposes
     const newTicketId = `T${Date.now().toString().slice(-6)}-${Math.random().toFixed(3).slice(-3)}`;
     const now = new Date().toISOString();

     let assignedDepartmentAndAgent = 'Unassigned'; // Default assignment
     let assignedDepartment = 'Unassigned'; // Default department

     if (model) {
         try {
             // --- Prompt Gemini for Automated Assignment ---
             const assignmentPrompt = `Analyze the following customer concern and assign it to the most appropriate department and agent from the list provided. Return ONLY the assigned department and agent in the format: Department: [Department Name], Agent: [Agent Name]. If no specific agent seems appropriate, just return the department (e.g., Department: [Department Name], Agent: Unassigned). If the concern does not fit any department, return Department: Other, Agent: Unassigned.

Customer Concern:
"${initialConcern}"

Available Departments and Agents:
${formattedDepartments}
`;
             console.log('Calling Gemini API for assignment with prompt:', assignmentPrompt);

             const result = await model.generateContent(assignmentPrompt);
             const response = await result.response;
             const assignmentText = response.text().trim();

             console.log('--- Gemini Assignment Response ---');
             console.log(assignmentText);
             console.log('---------------------------------');
             // Basic parsing of the assignment text (expecting "Department: ..., Agent: ...")
             const departmentMatch = assignmentText.match(/Department:\s*(.*?),\s*Agent:\s*(.*)/i);
             if (departmentMatch && departmentMatch[1] && departmentMatch[2]) {
                 const department = departmentMatch[1].trim();
                 const agent = departmentMatch[2].trim();
                 assignedDepartment = department; // Set the assigned department
                 assignedDepartmentAndAgent = `${department}${agent && agent.toLowerCase() !== 'unassigned' ? ' - ' + agent : ''}`;

                  // Optional: Validate if the assigned department/agent exists in your hardcoded data
                  const foundDept = hardcodedDepartments.find(d => d.name.toLowerCase() === department.toLowerCase());
                  if (!foundDept) {
                       console.warn(`Gemini assigned a department not in hardcoded list: ${department}`);
                         // Fallback or handle unknown department
                         assignedDepartment = 'Other'; // Fallback department
                        assignedDepartmentAndAgent = `Other - ${agent}`;
                   } else if (agent.toLowerCase() !== 'unassigned' && !foundDept.agents.some(a => a.toLowerCase() === agent.toLowerCase())) {
                        console.warn(`Gemini assigned an agent not in ${department} department: ${agent}`);
                         // Fallback or handle unknown agent in department
                         assignedDepartmentAndAgent = `${foundDept.name} - Unassigned`; // Use validated department name
                   }


             } else {
                 console.warn('Could not parse assignment from Gemini response:', assignmentText);
                 assignedDepartmentAndAgent = 'Assignment Failed'; // Indicate assignment failure
                   assignedDepartment = 'Unassigned'; // Indicate assignment failure
             }

         } catch (error: any) {
             console.error('Error during AI assignment:', error);
             assignedDepartmentAndAgent = 'Assignment Error'; // Indicate assignment error
               assignedDepartment = 'Unassigned'; // Indicate assignment error
         }
     } else {
          console.warn('AI model not available for assignment.');
     }


     const simulatedNewTicket: Ticket = {
         id: newTicketId,
         subject: 'Automated Ticket: ' + initialConcern.substring(0, 50) + (initialConcern.length > 50 ? '...' : ''), // Use part of concern for subject
         status: 'New', // Starts as New
         priority: 'Medium', // Default priority
         assignedTo: assignedDepartmentAndAgent, // Use the AI-determined assignment
         department: assignedDepartment, // ADDED: Set the assigned department
         channel: 'Phone', // Simulated phone call channel
         createdAt: now,
         updatedAt: now,
         lastMessageAt: now,
         description: initialConcern, // Use the initial concern text as description
         conversation: [{ sender: 'Customer', text: initialConcern, timestamp: now }], // Initial customer message
         publicNotes: '',
         privateNotes: `Ticket created automatically by AI after call. Initial Assignment: ${assignedDepartmentAndAgent}`,
         slaStatus: 'Within SLA', // Default SLA status for new tickets
         escalationLevel: 'None', // Default escalation level
     };
     setTickets(prevTickets => [...prevTickets, simulatedNewTicket]);
     console.log('Simulating adding new ticket:', simulatedNewTicket);
     alert(`New ticket ${newTicketId} automatically created! Assigned to: ${assignedDepartmentAndAgent}`);
     // Notify the agent
};


/**
 * @function TicketManagementPage
 * @description The main React functional component for the ticket management dashboard.
 * It displays tickets in a Kanban board, provides modals for detailed view and creation,
 * and integrates AI features for ticket processing and related concerns.
 * @returns {React.ReactElement} The JSX element for the ticket management page.
 */
export default function TicketManagementPage() {
  // --- State for Ticket Data and UI Controls ---
  /**
   * @constant {Ticket[]} tickets
   * @description The main state variable holding the array of all ticket objects.
   */
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  /**
   * @constant {string} filterStatus
   * @description State variable for the global status filter applied to the Kanban board.
   */
  const [filterStatus, setFilterStatus] = useState<string>('All'); // Global filter (optional for Kanban)

  /**
   * @constant {keyof Ticket} sortBy
   * @description State variable for the field by which tickets are sorted within each column.
   */
  const [sortBy, setSortBy] = useState<keyof Ticket>('createdAt'); // Field to sort by within columns

  /**
   * @constant {'asc' | 'desc'} sortOrder
   * @description State variable for the sort order (ascending or descending).
   */
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // asc or desc

  /**
   * @constant {boolean} isManualCreationModalOpen
   * @description State variable to control the visibility of the manual ticket creation modal.
   */
  const [isManualCreationModalOpen, setIsManualCreationModalOpen] = useState(false);

  /**
   * @constant {object} newTicketFormData
   * @description State variable holding the data for the new ticket form inputs.
   * @property {string} subject - The subject input value.
   * @property {string} channel - The channel input value.
   * @property {string} description - The description input value.
   */
  const [newTicketFormData, setNewTicketFormData] = useState({ subject: '', channel: '', description: '' });

  // --- State for Detailed Ticket View Modal ---
  /**
   * @constant {string | null} selectedTicketId
   * @description State variable holding the ID of the currently selected ticket for the detailed view modal, or null if no ticket is selected.
   */
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  /**
   * @constant {Ticket | undefined} selectedTicket
   * @description A memoized value representing the full ticket object for the currently selected `selectedTicketId`.
   * Recomputed whenever `selectedTicketId` or the `tickets` array changes.
   */
  const selectedTicket = useMemo(() => {
      return tickets.find(ticket => ticket.id === selectedTicketId);
  }, [selectedTicketId, tickets]); // Recompute when selectedTicketId or tickets change

  // ADDED: State for editable notes in the modal
    /**
     * @constant {string} publicNotes
     * @description State variable holding the public notes text in the detailed view modal.
     */
    const [publicNotes, setPublicNotes] = useState('');

    /**
     * @constant {string} privateNotes
     * @description State variable holding the private notes text in the detailed view modal.
     */
    const [privateNotes, setPrivateNotes] = useState('');

    // ADDED: State for conversation history in the modal
    /**
     * @constant {Message[]} currentConversation
     * @description State variable holding the conversation history for the currently selected ticket.
     */
    const [currentConversation, setCurrentConversation] = useState<Message[]>([]);

    // ADDED: State for Merge feature UI
    /**
     * @constant {boolean} showMergeInput
     * @description State variable to control the visibility of the ticket merge input field.
     */
    const [showMergeInput, setShowMergeInput] = useState(false);

    /**
     * @constant {string} mergeTicketId
     * @description State variable holding the ID entered by the user for merging tickets.
     */
    const [mergeTicketId, setMergeTicketId] = useState('');

  // --- State for AI Processing (Moved from page.tsx) ---
  /**
   * @constant {string} clientConcern
   * @description State variable holding the customer concern text entered or transcribed for AI processing.
   */
  const [clientConcern, setClientConcern] = useState('');

  /**
   * @constant {boolean} isProcessing
   * @description State variable indicating whether the AI processing is currently in progress.
   */
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * @constant {string} summary
   * @description State variable holding the AI-generated summary of the client concern.
   */
  const [summary, setSummary] = useState('');

  /**
   * @constant {string[]} suggestedReplies
   * @description State variable holding the AI-generated list of suggested replies.
   */
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);

  /**
   * @constant {typeof hardcodedKnowledgeBase} suggestedKB
   * @description State variable holding the list of suggested knowledge base articles based on AI processing.
   */
  const [suggestedKB, setSuggestedKB] = useState<typeof hardcodedKnowledgeBase>([]);

  /**
   * @constant {string} composeReply
   * @description State variable holding the text being composed in the agent reply area.
   */
  const [composeReply, setComposeReply] = useState('');

  /**
   * @constant {string | null} processingError
   * @description State variable holding any error message that occurred during AI processing.
   */
  const [processingError, setProcessingError] = useState<string | null>(null);

  // ADDED: State for call simulation popup
    /**
     * @constant {boolean} showIncomingCallPopup
     * @description State variable to control the visibility of the incoming call simulation popup.
     */
    const [showIncomingCallPopup, setShowIncomingCallPopup] = useState(false);

    /**
     * @constant {'ringing' | 'ai_answering' | null} callSimulationPhase
     * @description State variable tracking the current phase of the simulated incoming call.
     */
    const [callSimulationPhase, setCallSimulationPhase] = useState<'ringing' | 'ai_answering' | null>(null);

    /**
     * @constant {React.MutableRefObject<NodeJS.Timeout | null>} callTimerRef
     * @description A ref to hold the ID of the timer used for simulating call phases.
     */
    const callTimerRef = useRef<NodeJS.Timeout | null>(null); // Use useRef for the timer ID

  // --- State for Actual Speech-to-Text (Moved from page.tsx) ---
  /**
   * @constant {boolean} isRecording
   * @description State variable indicating whether speech-to-text recording is active.
   */
  const [isRecording, setIsRecording] = useState(false);

  /**
   * @constant {string | null} sttError
   * @description State variable holding any error message that occurred during speech-to-text.
   */
  const [sttError, setSttError] = useState<string | null>(null);

  /**
   * @constant {string} interimTranscript
   * @description State variable holding the current interim (not yet finalized) transcript from speech-to-text.
   */
  const [interimTranscript, setInterimTranscript] = useState(''); // State to hold interim results

  /**
   * @constant {boolean} isSTTReady
   * @description State variable indicating whether the Speech-to-Text API is initialized and ready.
   */
  const [isSTTReady, setIsSTTReady] = useState(false); // Track if STT API is initialized

  /**
   * @constant {React.MutableRefObject<any | null>} recognitionRef
   * @description A ref to hold the SpeechRecognition instance.
   */
  const recognitionRef = useRef<any | null>(null); // Use useRef to hold the SpeechRecognition instance (Moved from page.tsx)

    // --- State for Related Concerns ---
    /**
     * @constant {string[]} selectedRelatedTicketIds
     * @description State variable holding the IDs of related tickets currently selected for bulk actions.
     */
    const [selectedRelatedTicketIds, setSelectedRelatedTicketIds] = useState<string[]>([]);

    /**
     * @constant {boolean} isSendingBulkReply
     * @description State variable indicating if a bulk reply is currently being sent.
     */
    const [isSendingBulkReply, setIsSendingBulkReply] = useState(false);

    /**
     * @constant {string | null} bulkReplyStatus
     * @description State variable holding the status message for a bulk reply action.
     */
    const [bulkReplyStatus, setBulkReplyStatus] = useState<string | null>(null);

  // ADDED: Handle simulating an incoming call
 /**
  * @function handleSimulateIncomingCall
  * @description Initiates a simulation of an incoming phone call, showing a popup
  * and eventually creating a new ticket with potential AI assignment.
  */
 const handleSimulateIncomingCall = () => {
     if (showIncomingCallPopup) return; // Prevent multiple popups

     setShowIncomingCallPopup(true);
     setCallSimulationPhase('ringing');
     console.log('Simulating incoming call...');
     // Sample initial customer concern for the automated ticket
      const sampleInitialConcern = "I have a problem with my app crashing every time I try to open the settings."; // Example tech issue
      // const sampleInitialConcern = "My last invoice seems incorrect, I was charged more than expected."; // Example billing issue
      // const sampleInitialConcern = "I'd like to suggest a new feature for exporting data."; // Example feature request

     // Timer for "ringing" phase (3 seconds)
     callTimerRef.current = setTimeout(() => {
         setCallSimulationPhase('ai_answering');
         console.log('AI is now answering...');

         // Timer for "AI answering" phase (5 seconds)
         callTimerRef.current = setTimeout(async () => { // Make this async to await ticket creation
             setShowIncomingCallPopup(false); // Close popup
             setCallSimulationPhase(null); // Reset phase
             console.log('Call simulation ended, creating ticket with AI assignment...');
             // Call the modified addNewHardcodedTicket with the model and initial concern
             await addNewHardcodedTicket(setTickets, model, sampleInitialConcern);
         }, 5000); // AI answering duration

     }, 3000); // Ringing duration
 };

 // ADDED: Cleanup timer on component unmount
 /**
  * @effect
  * @description Cleans up the call simulation timer when the component unmounts to prevent memory leaks.
  */
 useEffect(() => {
     return () => {
         if (callTimerRef.current) {
             clearTimeout(callTimerRef.current);
         }
     };
 }, []); // Empty dependency array to run only on mount and unmount


  // --- Effect to Initialize SpeechRecognition (Moved from page.tsx) ---
  // This effect will now run when the Kanban component mounts.
  /**
   * @effect
   * @description Initializes the Web Speech Recognition API when the component mounts.
   * Sets up event handlers for start, result, error, and end events.
   * Handles browser compatibility and microphone permission errors.
   * Cleans up the recognition instance on unmount.
   */
  useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
          setSttError("Speech recognition not supported in this browser.");
          console.error("Speech Recognition API not supported.");
          setIsSTTReady(true); // Mark as ready (or not supported)
          return;
      }

      try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onstart = () => {
              console.log('Speech recognition started.');
              setIsRecording(true);
              setSttError(null);
              setInterimTranscript('');
              // Do NOT clear clientConcern here, let it accumulate
              // setClientConcern(''); // Removed clearing here
          };

          recognitionRef.current.onresult = (event: any) => {
              console.log('Speech recognition result received.');
              let finalTranscript = '';
              let currentInterimTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  const transcript = event.results[i][0].transcript;
                  if (event.results[i].isFinal) {
                      finalTranscript += transcript;
                  } else {
                      currentInterimTranscript += transcript;
                  }
              }

              // Append final transcript to the main concern text
              if (finalTranscript) {
                  setClientConcern(prevConcern => prevConcern + (prevConcern.trim() ? ' ' : '') + finalTranscript.trim());
                  setInterimTranscript(''); // Clear interim transcript once a final result is processed
              }

              // Always update interim transcript state for display
              setInterimTranscript(currentInterimTranscript);
               // Optional: Automatically scroll the textarea
               const textarea = document.getElementById('client-concern-textarea') as HTMLTextAreaElement | null;
                if (textarea) {
                     textarea.scrollTop = textarea.scrollHeight;
                }
          };

          recognitionRef.current.onerror = (event: any) => {
              console.error('Speech recognition error:', event.error);
              let errorMessage = "An error occurred during speech recognition.";
               switch (event.error) {
                   case 'not-allowed':
                   case 'permission-denied':
                       errorMessage = "Microphone permission denied. Please allow access.";
                       break;
                   case 'no-speech':
                        console.log("No speech detected in this segment (in continuous mode).");
                        return; // Don't stop recording for 'no-speech'
                    case 'audio-capture':
                         errorMessage = "Could not start audio capture. Ensure microphone is available.";
                         setIsRecording(false); // Stop recording on critical error
                         break;
                    default:
                       errorMessage += ` (Error: ${event.error})`;
                       setIsRecording(false); // Stop recording on other errors
               }
               setSttError(errorMessage);
          };

          recognitionRef.current.onend = () => {
              console.log('Speech recognition ended.');
              setInterimTranscript(''); // Clear any leftover interim transcript
               // Only set isRecording to false if it wasn't stopped by an error
               if (isRecording) {
                   setIsRecording(false);
               }
          };

          setIsSTTReady(true);
           } catch (error: any) {
           console.error("Error initializing Speech Recognition:", error);
           setSttError(`Error initializing Speech Recognition: ${error.message || 'Unknown error'}`);
           setIsSTTReady(true);
      }

      // Clean up the recognition instance
      return () => {
          if (recognitionRef.current) {
              recognitionRef.current.stop();
              recognitionRef.current = null;
          }
      };
  }, []); // Effect runs once on mount


    // --- Effect to Load Ticket Data, Notes, and Conversation into Modal Sections ---
    /**
     * @effect
     * @description Populates the modal's state (client concern, notes, conversation) when a ticket is selected.
     * Clears AI processing state and related concerns state when the modal is closed.
     * Ensures speech recording is stopped when the modal state changes.
     * Runs whenever `selectedTicket` changes.
     */
    useEffect(() => {
        if (selectedTicket) {
            // When a ticket is selected, populate the client concern with its description
            setClientConcern(selectedTicket.description || '');
            // Load existing notes into state
            setPublicNotes(selectedTicket.publicNotes || ''); // Load public notes
            setPrivateNotes(selectedTicket.privateNotes || ''); // Load private notes
            setCurrentConversation(selectedTicket.conversation || []); // ADDED: Load conversation

            // Reset AI results when a new ticket is selected
            setSummary('');
            setSuggestedReplies([]);
            setSuggestedKB([]);
            setComposeReply('');
            setProcessingError(null);
            // Ensure recording is stopped if one was active from a previous modal view
            if (isRecording && recognitionRef.current) {
                recognitionRef.current.stop();
            }
             // Clear selected related tickets when a new main ticket is selected
            setSelectedRelatedTicketIds([]); // ADDED: Clear selected related tickets
            setBulkReplyStatus(null); // ADDED: Clear bulk reply status message

        } else {
             // When modal closes, clear AI state, notes state, and conversation state
            setClientConcern('');
            setSummary('');
            setSuggestedReplies([]);
            setSuggestedKB([]);
            setComposeReply('');
            setProcessingError(null);
            setPublicNotes(''); // Clear public notes state
            setPrivateNotes(''); // Clear private notes state
            setCurrentConversation([]); // ADDED: Clear conversation state
            // Ensure recording is stopped if modal closes while recording
             if (isRecording && recognitionRef.current) {
                recognitionRef.current.stop();
            }
             // Clear selected related tickets when modal closes
            setSelectedRelatedTicketIds([]); // ADDED: Clear selected related tickets
            setBulkReplyStatus(null); // ADDED: Clear bulk reply status message
        }
    }, [selectedTicket]); // Rerun this effect when selectedTicket changes


  // --- Event Handlers (Kanban Specific) ---
  /**
   * @function handleFilterChange
   * @description Handles changes to the global status filter select input.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event from the select element.
   */
  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(event.target.value);
  };

  /**
   * @function handleSortChange
   * @description Handles changes to the sort field select input or the sort order button.
   * Toggles sort order if the same field is selected again.
   * @param {keyof Ticket} field - The field to sort the tickets by.
   */
  const handleSortChange = (field: keyof Ticket) => {
    const order = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'; // Toggle order
    setSortBy(field);
    setSortOrder(order);
  };

  /**
   * @function handleTicketClick
   * @description Handles clicks on individual ticket cards in the Kanban board.
   * Sets the selected ticket ID to open the detailed view modal.
   * @param {string} ticketId - The ID of the clicked ticket.
   */
  const handleTicketClick = (ticketId: string) => {
      console.log("Ticket clicked:", ticketId); // ADDED: Console log to verify click
      // Set the selected ticket ID to open the modal AND trigger related concerns section
      setSelectedTicketId(ticketId);
  };

  /**
   * @function handleDetailedViewClose
   * @description Handles closing the detailed ticket view modal.
   * Clears the selected ticket ID, which triggers the useEffect to reset modal-specific state.
   */
  const handleDetailedViewClose = () => {
      // Close the modal by clearing the selected ticket ID
      setSelectedTicketId(null);
      // The useEffect for selectedTicket handles clearing AI state and related concerns state
  };

  /**
   * @function handleStatusChange
   * @description Simulates changing the status of a ticket.
   * Updates the ticket status and `updatedAt` timestamp in the state.
   * In a real application, this would call a backend API.
   * @param {string} ticketId - The ID of the ticket to update.
   * @param {Ticket['status']} newStatus - The new status for the ticket.
   */
   const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
      // TODO: Replace with backend API call to update status in Supabase
      setTickets(tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } : ticket
      ));
      console.log(`Simulating status change for ${ticketId} to ${newStatus}`);
  };

   /**
    * @function handleAssignChange
    * @description Simulates changing the assigned agent/team for a ticket.
    * Updates the `assignedTo` and `department` fields and the `updatedAt` timestamp in the state.
    * In a real application, this would call a backend API.
    * @param {string} ticketId - The ID of the ticket to update.
    * @param {string | null} newAssignee - The new assignee string or null.
    */
   const handleAssignChange = (ticketId: string, newAssignee: string | null) => {
      // TODO: Replace with backend API call to update assignment in Supabase
      // Also update the department field based on the new assignee
      const newDepartment = getDepartmentFromAssignment(newAssignee); // Get department from new assignee
      setTickets(tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, assignedTo: newAssignee, department: newDepartment, updatedAt: new Date().toISOString() } : ticket // MODIFIED: Update department
      ));
      console.log(`Simulating assignment change for ${ticketId} to ${newAssignee}. Department updated to ${newDepartment}`);
   };

  // --- Manual Ticket Creation ---
  /**
   * @function handleManualCreateClick
   * @description Opens the manual ticket creation modal.
   */
   const handleManualCreateClick = () => {
       setIsManualCreationModalOpen(true);
   };

   /**
    * @function handleManualFormChange
    * @description Handles input changes in the manual ticket creation form.
    * Updates the `newTicketFormData` state.
    * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - The change event from the input element.
    */
   const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
       const { name, value } = e.target;
       setNewTicketFormData(prevState => ({ ...prevState, [name]: value }));
   };

   /**
    * @function handleManualFormSubmit
    * @description Handles the submission of the manual ticket creation form.
    * Simulates creating a new ticket and adding it to the state.
    * Resets the form and closes the modal.
    * In a real application, this would call a backend API.
    * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
    */
   const handleManualFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       // TODO: Replace with backend API call to create ticket in Supabase
       // Assign a simple unique ID for hardcoded data
       const newTicketId = `T${(tickets.length + 1).toString().padStart(3, '0')}`;
       const now = new Date().toISOString();

        // Determine department for manually created ticket (e.g., based on a dropdown or default)
        // For this demo, we'll set it to 'Unassigned' or you could add a department select to the form
       const manualDepartment = 'Unassigned'; // Or add a select input to the form

       const brandNewTicket: Ticket = {
           id: newTicketId,
           subject: newTicketFormData.subject || 'No Subject',
           status: 'New', // Manually created tickets start as New
           priority: 'Medium', // Default priority for manual tickets
           assignedTo: null, // No assignment by default
           department: manualDepartment, // ADDED: Set department for manual ticket
           channel: (newTicketFormData.channel || 'Other') as Ticket['channel'], // Use selected channel or 'Other'
           createdAt: now,
           updatedAt: now,
           lastMessageAt: now,
           description: newTicketFormData.description, // Include description
       };
       setTickets([...tickets, brandNewTicket]);
       console.log('Simulating creating new ticket:', brandNewTicket);
       setNewTicketFormData({ subject: '', channel: '', description: '' }); // Reset form
       setIsManualCreationModalOpen(false); // Close modal
   };

   /**
    * @function handleManualModalClose
    * @description Closes the manual ticket creation modal and resets the form data.
    */
   const handleManualModalClose = () => {
       setIsManualCreationModalOpen(false);
       setNewTicketFormData({ subject: '', channel: '', description: '' }); // Reset form on close
   }

    // --- Sorting Logic (Corrected for potential nulls) ---
    /**
     * @function sortTickets
     * @description Sorts an array of tickets based on the current `sortBy` field and `sortOrder`.
     * Handles null values and different data types (string, number, date).
     * @param {Ticket[]} ticketsToSort - The array of tickets to sort.
     * @returns {Ticket[]} A new array containing the sorted tickets.
     */
    const sortTickets = (ticketsToSort: Ticket[]) => {
        return [...ticketsToSort].sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            // Handle null values explicitly based on sort order
            if (aValue === null && bValue !== null) {
                return sortOrder === 'asc' ? -1 : 1; // Nulls first for asc, last for desc
            }
            if (aValue !== null && bValue === null) {
                return sortOrder === 'asc' ? 1 : -1; // Non-nulls first for asc, last for desc
            }
            if (aValue === null && bValue === null) {
                return 0; // Both are null, treat as equal
            }

            // Now we know neither aValue nor bValue are null for the comparison
            // Use type assertions after null checks
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
            // Handle date comparison if sortBy is a date field
            if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'lastMessageAt') {
                const dateA = new Date(aValue as string); // Safe to cast to string after null check
                const dateB = new Date(bValue as string); // Safe to cast to string after null check
                return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
            }

            // Fallback for other types - ensure comparison is safe
            if (aValue !== null && aValue !== undefined && bValue !== null && bValue !== undefined && aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue !== null && aValue !== undefined && bValue !== null && bValue !== undefined && aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
             return 0; // Values are equal
        });
    };

    // ADDED: Handle Merging Tickets
    /**
     * @function handleMergeTickets
     * @description Initiates the ticket merging process by showing the merge input field in the modal.
     */
    const handleMergeTickets = () => {
        if (!selectedTicket) return;
        setShowMergeInput(true); // Show the merge input field
    };

    // ADDED: Handle Confirm Merge
    /**
     * @function handleConfirmMerge
     * @description Handles the confirmation of merging the currently selected ticket into another ticket.
     * Simulates merging data and removing the source ticket from the state.
     * In a real application, this would call a backend API.
     * @fires {Alert} Displays alerts for validation and simulated completion/errors.
     */
    const handleConfirmMerge = () => {
        if (!selectedTicket || !mergeTicketId.trim()) {
            alert("Please select a ticket and enter a ticket ID to merge into.");
            return;
        }

        const targetTicket = tickets.find(t => t.id === mergeTicketId.trim());
        if (!targetTicket) {
            alert(`Ticket ID "${mergeTicketId.trim()}" not found.`);
            return;
        }

        if (selectedTicket.id === targetTicket.id) {
            alert("Cannot merge a ticket into itself.");
            return;
        }

        // TODO: Implement actual merge logic (combine conversations, notes, update status, etc.)
        console.log(`Simulating merging ticket ${selectedTicket.id} into ${targetTicket.id}`);
        // Simulate updating the merged ticket and removing the current one
        setTickets(prevTickets => prevTickets.map(ticket => {
            if (ticket.id === targetTicket.id) {
                // Simulate adding current ticket's description/conversation to target ticket
                const mergedDescription = `${ticket.description || ''}\n\n--- Merged from ${selectedTicket.id} ---\n\n${selectedTicket.description || ''}`;
                const mergedConversation = [...(ticket.conversation || []), ...(selectedTicket.conversation || [])];
                const mergedPublicNotes = `${ticket.publicNotes || ''}\n${selectedTicket.publicNotes || ''}`;
                const mergedPrivateNotes = `${ticket.privateNotes || ''}\n${selectedTicket.privateNotes || ''}`;

                return {
                    ...ticket,
                    description: mergedDescription.trim(),
                    conversation: mergedConversation,
                    publicNotes: mergedPublicNotes.trim(),
                    privateNotes: mergedPrivateNotes.trim(),
                    updatedAt: new Date().toISOString(),
                    // Optionally change status of target ticket, e.g., to 'In Progress'
                    // status: 'In Progress',
                };
            }
            return ticket;
        }).filter(ticket => ticket.id !== selectedTicket.id)); // Remove the merged ticket

        alert(`Ticket ${selectedTicket.id} merged into ${targetTicket.id} (simulated)!`);
        handleDetailedViewClose(); // Close the modal after merging
        setShowMergeInput(false); // Hide merge input
        setMergeTicketId(''); // Clear merge input
    };

    // ADDED: Handle Escalating Ticket
    /**
     * @function handleEscalateTicket
     * @description Simulates escalating the currently selected ticket.
     * Changes the priority, updates the escalation level, and adds a note.
     * In a real application, this would call a backend API and potentially trigger notifications.
     * @fires {Alert} Displays an alert indicating the simulated escalation.
     */
    const handleEscalateTicket = () => {
        if (!selectedTicket) return;
        // TODO: Implement escalation logic (update status, priority, notify team, etc.)
        console.log(`Simulating escalating ticket ${selectedTicket.id}`);
        // Simulate changing priority and adding a note
        const escalatedPriority = selectedTicket.priority === 'Low' ? 'Medium' :
                                  selectedTicket.priority === 'Medium' ? 'High' :
                                  selectedTicket.priority === 'High' ? 'Urgent' : 'Urgent';

        const escalationNote = `Ticket escalated to ${escalatedPriority} priority.`;
        setTickets(prevTickets => prevTickets.map(ticket => {
            if (ticket.id === selectedTicket.id) {
                 const updatedPrivateNotes = `${ticket.privateNotes || ''}\n${new Date().toLocaleString()}: ${escalationNote}`;
                return {
                    ...ticket,
                    priority: escalatedPriority,
                    escalationLevel: selectedTicket.escalationLevel === 'None' ? 'Level 1' :
                                     selectedTicket.escalationLevel === 'Level 1' ? 'Level 2' :
                                     selectedTicket.escalationLevel === 'Level 2' ? 'Level 3' : 'Level 3',
                    privateNotes: updatedPrivateNotes.trim(),
                    updatedAt: new Date().toISOString(),
                    // Optionally change status, e.g., to 'In Progress' or 'Pending'
                    // status: 'Pending',
                };
            }
            return ticket;
        }));
        alert(`Ticket ${selectedTicket.id} escalated to ${escalatedPriority} priority (simulated)!`);
        // Optionally keep modal open or close it
    };

  // --- Handle Processing with Direct Gemini Call (Moved from page.tsx) ---
  /**
   * @function handleProcessTicket
   * @description Handles the click event for the "Process Ticket" button.
   * Calls the Google Gemini model to generate a summary, suggested replies,
   * and relevant knowledge base articles based on the `clientConcern` text.
   * Updates the UI state with the AI-generated results.
   * Handles errors during the AI call.
   * @async
   * @fires {Alert} Displays an alert if no text is available to process or the AI model is not configured.
   */
  const handleProcessTicket = async () => {
        // Use the combined text for processing from the modal's input
        const textToProcess = clientConcern + interimTranscript;
        if (!textToProcess.trim()) {
            alert('Please enter client concern text to process.');
            return;
        }

        if (!model) {
             alert('AI model is not configured. Check API key and ensure NEXT_PUBLIC_GOOGLE_API_KEY is set.');
             return;
        }

        setIsProcessing(true);
        setProcessingError(null);
        setSummary('');
        setSuggestedReplies([]);
        setSuggestedKB([]);
        // composeReply remains

        try {
             // Gemini call remains client-side for this simplified demo
             const prompt = `You are an AI-powered customer service assistant. Your task is to analyze the following customer concern and provide:
1.  A concise summary of the customer's concern.
2.  2-3 empathetic and helpful suggested replies for an agent to use.
3.  A list of relevant articles from the provided knowledge base.
Format your response using the exact section headers:
**Summary:**
**Suggested Replies:**
**Relevant KB Articles:**

If no relevant KB articles are found, state "None found." under that section.

Customer Concern:
"${textToProcess}"

Knowledge Base Articles:
${formattedKB}
`;

            console.log('Calling Gemini API with prompt for processing:', prompt);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log('--- Raw Gemini Response Text ---');
            console.log(text);
            console.log('-------------------------------');
            // --- Parse Gemini's Response (Your existing parsing logic) ---
            let currentSummary = '';
            let currentReplies: string[] = [];
            let currentKBTitles: string[] = [];

            const summaryHeaderRegex = /\*\*Summary:\*\*/i;
            const repliesHeaderRegex = /\*\*Suggested Replies:\*\*/i;
            const kbHeaderRegex = /\*\*Relevant KB Articles:\*\*/i;

            const summaryIndex = text.search(summaryHeaderRegex);
            const repliesIndex = text.search(repliesHeaderRegex);
            const kbIndex = text.search(kbHeaderRegex);

            if (summaryIndex !== -1) {
                const summaryContentEndIndex = (repliesIndex !== -1) ? repliesIndex : (kbIndex !== -1) ? kbIndex : text.length;
                currentSummary = text.substring(summaryIndex + text.match(summaryHeaderRegex)![0].length, summaryContentEndIndex).trim();
            } else {
                console.warn('Could not find Summary section header.');
            }

            if (repliesIndex !== -1) {
                const repliesContentEndIndex = (kbIndex !== -1) ? kbIndex : text.length;
                 const rawRepliesText = text.substring(repliesIndex + text.match(repliesHeaderRegex)![0].length, repliesContentEndIndex).trim();
                 currentReplies = rawRepliesText.split('\n')
                     .map(line => line.trim())
                     .filter(line => line.length > 0)
                     .map(line => line.replace(/^[*-]?\s*/, '').trim());
            } else {
                 console.warn('Could not find Suggested Replies section header.');
            }

            if (kbIndex !== -1) {
                 const rawKbText = text.substring(kbIndex + text.match(kbHeaderRegex)![0].length).trim();
                 if (rawKbText.toLowerCase() !== 'none found.' && rawKbText.toLowerCase() !== 'none') {
                    currentKBTitles = rawKbText.split('\n')
                         .map(line => line.trim())
                         .filter(line => line.length > 0)
                         .map(line => line.replace(/^[*-]?\s*/, '').trim());
                 } else {
                     currentKBTitles = ['None found.'];
                 }
             } else {
                 console.warn('Could not find Relevant KB Articles section header.');
                 currentKBTitles = ['None found.'];
             }


            // --- Find the full KB objects for the relevant titles ---
            const relevantKBObjects = hardcodedKnowledgeBase?.filter(article =>
                 currentKBTitles.includes(article.title)
            ) || [];

             if (relevantKBObjects.length === 0) {
                 if (currentKBTitles.includes('None found.')) {
                      relevantKBObjects.push({ id: 'KB-None', title: 'No relevant articles found.', content: '' });
                 } else if (currentKBTitles.length > 0) {
                      console.warn("Gemini suggested KB titles that did not match hardcoded KB:", currentKBTitles);
                      relevantKBObjects.push({ id: 'KB-None', title: 'Could not find matching articles.', content: 'Gemini suggested titles that did not match our knowledge base.' });
                 } else {
                       relevantKBObjects.push({ id: 'KB-None', title: 'Could not parse KB suggestions.', content: 'The AI response did not contain a recognizable Knowledge Base section.' });
                 }
             }

            setSummary(currentSummary);
            setSuggestedReplies(currentReplies);
            setSuggestedKB(relevantKBObjects);

        } catch (error: any) {
            console.error('Error processing concern:', error);
            setProcessingError(`Error processing concern: ${error.message || 'Unknown error'}`);
            setSummary('');
            setSuggestedReplies([]);
            setSuggestedKB([]);
        } finally {
            setIsProcessing(false);
        }
    };

  // --- Handler to Start/Stop Speech-to-Text (Moved from page.tsx) ---
    /**
     * @function handleToggleSpeechToText
     * @description Toggles the start and stop states of the Web Speech Recognition API.
     * Updates recording state and handles initialization/errors.
     * Appends final transcripts to the `clientConcern`.
     * @fires {Alert} Displays an alert if the Speech Recognition API is not initialized or supported.
     */
    const handleToggleSpeechToText = () => {
        if (!recognitionRef.current) {
             console.error("Speech Recognition API is not initialized or supported.");
             setSttError("Speech recognition not supported or failed to initialize.");
             return;
         }

        if (isRecording) {
            // Stop recognition
            recognitionRef.current.stop();
        } else {
            // Clear previous errors and interim transcript, and start recognition
             setSttError(null); // Clear previous STT errors
             setInterimTranscript(''); // Clear interim transcript
            // Do NOT clear clientConcern here when starting recording within modal,
            // as it might contain the ticket description already.
            recognitionRef.current.start();
        }
    };

     /**
      * @function handleClearCompose
      * @description Clears the text in the compose reply area.
      */
    const handleClearCompose = () => {
        setComposeReply('');
    };

     /**
      * @function handleSendAgentReply
      * @description Simulates sending an agent's reply.
      * Adds the composed message to the `currentConversation` state and updates the ticket in the main `tickets` state.
      * Clears the compose reply area.
      * In a real application, this would send the message via a communication channel and update the backend.
      * @fires {Alert} Displays an alert if the reply area is empty.
      */
    const handleSendAgentReply = () => {
        if (!composeReply.trim()) {
            alert('Please type a reply to send.');
            return;
        }
        if (!selectedTicket) {
            console.error("No ticket selected to send a reply to.");
            return;
        }

        const agentMessage: Message = {
            sender: 'Agent',
            text: composeReply.trim(),
            timestamp: new Date().toISOString(),
        };
        // Update the local conversation state
        setCurrentConversation(prevConversation => [...prevConversation, agentMessage]);
        console.log("Added agent message to conversation:", agentMessage);

        // Simulate updating the ticket in the main tickets state
        setTickets(prevTickets => prevTickets.map(ticket =>
            ticket.id === selectedTicket.id
                ? { ...ticket, conversation: [...(ticket.conversation || []), agentMessage], updatedAt: new Date().toISOString(), lastMessageAt: new Date().toISOString() }
                : ticket
        ));
        // Clear the compose reply area
        setComposeReply('');
        console.log("Reply sent (simulated) and compose area cleared.");

        // Optional: Automatically scroll the conversation area to the bottom
        const conversationArea = document.getElementById('conversation-area') as HTMLDivElement | null; // Add ID to conversation div
         if (conversationArea) {
              conversationArea.scrollTop = conversationArea.scrollHeight;
         }
    };


    /**
     * @function handleSuggestionClick
     * @description Populates the compose reply area with the text of a clicked response suggestion.
     * @param {string} suggestion - The suggested reply text.
     */
    const handleSuggestionClick = (suggestion: string) => {
        setComposeReply(suggestion);
    };

    // --- Related Concerns Logic ---
    /**
     * @function handleRelatedCheckboxChange
     * @description Handles the change event of the checkbox for selecting a related ticket.
     * Adds or removes the ticket ID from the `selectedRelatedTicketIds` state.
     * @param {string} ticketId - The ID of the related ticket.
     * @param {boolean} isChecked - The checked state of the checkbox.
     */
    const handleRelatedCheckboxChange = (ticketId: string, isChecked: boolean) => {
        setSelectedRelatedTicketIds(prevIds =>
            isChecked ? [...prevIds, ticketId] : prevIds.filter(id => id !== ticketId)
        );
    };

    /**
     * @function handleSendBulkTailoredResponse
     * @description Simulates sending a bulk tailored response to the selected related tickets.
     * Uses the AI model to draft a response based on the original ticket's context.
     * Updates UI state to show processing and status.
     * In a real application, this would integrate with a communication platform (CPaaS) and potentially tailor responses individually.
     * @async
     * @fires {Alert} Displays alerts for validation and simulated completion/errors.
     */
    const handleSendBulkTailoredResponse = async () => {
        if (selectedRelatedTicketIds.length === 0) {
            alert('Please select at least one related ticket to send a tailored response.');
            return;
        }

        if (!model) {
             alert('AI model is not configured. Cannot send tailored responses.');
             return;
        }

        setIsSendingBulkReply(true);
        setBulkReplyStatus(null);
        // In a real application, you would iterate through selectedRelatedTicketIds,
        // fetch details for each ticket, potentially use Gemini to tailor a response
        // based on the original ticket's context and the related ticket's context,
        // and then send the response via your communication channel (email, chat, etc.).
        console.log(`Simulating sending tailored response to ${selectedRelatedTicketIds.length} related tickets.`);
        console.log("Selected related ticket IDs:", selectedRelatedTicketIds);
        console.log("Context from original ticket:", selectedTicket?.subject, selectedTicket?.description); // Use optional chaining

        try {
             // --- Simulate AI tailoring the response ---
             // For this demo, we'll generate a single tailored response based on the
             // original ticket's summary/description and mention the related tickets.
             const relatedTicketSubjects = tickets
                 .filter(t => selectedRelatedTicketIds.includes(t.id))
                 .map(t => t.subject || `Ticket ${t.id}`)
                 .join(', ');
             const tailoringPrompt = `Draft a brief, empathetic, and tailored response that an agent can send to multiple customers with similar concerns. The primary concern is related to: "${selectedTicket?.subject || selectedTicket?.description}". You are sending this reply to customers regarding tickets: ${relatedTicketSubjects}. Acknowledge the similar issue and provide a general update or initial troubleshooting step based on the original ticket's context. Keep the response concise and professional.`;

             console.log('Calling Gemini API for tailored bulk response draft:', tailoringPrompt);

             const result = await model.generateContent(tailoringPrompt);
             const response = await result.response;
             const tailoredReplyText = response.text().trim();

             console.log('--- Gemini Tailored Reply Draft ---');
             console.log(tailoredReplyText);
             console.log('-----------------------------------');
             // --- Simulate Sending ---
             // In a real app, you'd use your CPaaS or email integration here
             // to send this tailoredReplyText to the customers associated with
             // the selectedRelatedTicketIds.
             setBulkReplyStatus(`Simulated sending tailored response to ${selectedRelatedTicketIds.length} tickets.`);
             alert(`Simulated sending tailored response to selected tickets:\n\n${tailoredReplyText}`);
             // Clear selected tickets after simulated sending
             setSelectedRelatedTicketIds([]);
           } catch (error: any) {
            console.error('Error simulating bulk tailored response:', error);
            setBulkReplyStatus(`Error sending bulk response: ${error.message || 'Unknown error'}`);
            alert(`Error simulating sending bulk response: ${error.message || 'Unknown error'}`);
           } finally {
            setIsSendingBulkReply(false);
        }
    };

    /**
     * @constant {{ [department: string]: Ticket[] }} relatedTicketsByDepartment
     * @description A memoized object grouping related tickets by department.
     * Finds tickets related to the `selectedTicket` if one is selected, otherwise
     * shows a hardcoded list of related tickets for demonstration.
     * Recomputed when `selectedTicket` or `tickets` change.
     */
    const relatedTicketsByDepartment = useMemo(() => {
        // If a ticket is selected, find tickets related to the selected one
        if (selectedTicket) {
            const related = tickets.filter(ticket =>
                // Exclude the selected ticket itself and tickets that are already closed or resolved
                ticket.id !== selectedTicket.id &&
                ticket.status !== 'Resolved' &&
                ticket.status !== 'Closed' &&
                // Check for relatedness using the helper function
                isTicketRelated(selectedTicket, ticket)
            );


            // Group by department
            const grouped: { [department: string]: Ticket[] } = {};
            related.forEach(ticket => {
                const department = getDepartmentFromAssignment(ticket.assignedTo);
                if (!grouped[department]) {
                    grouped[department] = [];
                }
                grouped[department].push(ticket);
            });

            return grouped;
        } else {
            // If no ticket is selected, return the hardcoded list of login-related tickets
            const hardcodedRelatedTicketIds = ['T001', 'T008', 'T009', 'T010'];
            const hardcodedRelatedTickets = tickets.filter(ticket =>
                hardcodedRelatedTicketIds.includes(ticket.id)
            );
             // Group the hardcoded tickets by department
             const grouped: { [department: string]: Ticket[] } = {};
             hardcodedRelatedTickets.forEach(ticket => {
                 const department = getDepartmentFromAssignment(ticket.assignedTo);
                 if (!grouped[department]) {
                     grouped[department] = [];
                 }
                 grouped[department].push(ticket);
             });

             return grouped;
         }
    }, [selectedTicket, tickets]); // Recompute when selectedTicket or tickets change


  // --- Filtered and Sorted Tickets (Applied per status column) ---
    /**
     * @constant {Ticket[]} filteredTickets
     * @description A memoized array of tickets filtered based on the current `filterStatus`.
     * Recomputed when `tickets` or `filterStatus` change.
     */
    const filteredTickets = useMemo(() => {
      let filtered = tickets;
      if (filterStatus !== 'All') {
          filtered = filtered.filter(ticket => ticket.status === filterStatus);
      }
      return filtered;
  }, [tickets, filterStatus]);

  // --- Rendering ---
  /**
   * @returns {React.ReactElement} The JSX for the Ticket Management UI.
   */
  return (
    // Main container with light blue background theme
    <div className="min-h-screen bg-blue-50 p-8">
      {/* Floating Simulate Call Button */}
       <button
           onClick={handleSimulateIncomingCall}
           className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-40" // z-40 to be below modals but above other content
           disabled={showIncomingCallPopup} // Disable if popup is already shown
       >
           <Phone className="w-6 h-6" />
       </button>
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">
          Ticket Management
        </h1>
        <p className="text-lg text-gray-700">
          View and manage all customer tickets in a Kanban board.
        </p>
         {/* Display STT errors */}
         {sttError && (
              <p className="text-red-600 mt-2">{sttError}</p>
         )}
      </header>

      {/* Controls Area (Filter, Sort, Create) */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
           <div className="flex items-center space-x-4">
              {/* Filter */}
              <div className="flex items-center">
                  <Filter className="w-5 h-5 text-gray-600 mr-2" />
                  <label htmlFor="statusFilter" className="mr-2 text-gray-700">Global Status Filter:</label>
                  <select
                      id="statusFilter"
                      value={filterStatus}
                      onChange={handleFilterChange}
                      className="border rounded px-2 py-1 text-gray-700"
                  >
                      <option value="All">All</option>
                      {kanbanStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                      ))}
                  </select>
              </div>
              {/* Sort */}
               <div className="flex items-center">
                   <ArrowUpDown className="w-5 h-5 text-gray-600 mr-2" />
                    <label htmlFor="sortBy" className="mr-2 text-gray-700">Sort Within Columns By:</label>
                   <select
                       id="sortBy"
                       value={sortBy as string} // Cast to string for select value
                       onChange={(e) => handleSortChange(e.target.value as keyof Ticket)}
                       className="border rounded px-2 py-1 text-gray-700"
                   >
                        {/* Add more sort options as needed */}
                       <option value="createdAt">Created At</option>
                       <option value="updatedAt">Updated At</option>
                       <option value="priority">Priority</option>
                       <option value="status">Status</option> {/* Sorting by status within a status column might be less useful */}
                       <option value="assignedTo">Assigned To</option>
                   </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="ml-2 p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                         {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                    </button>
               </div>
          </div>


          {/* Manual Ticket Creation Button */}
          <div>
              <button
                  onClick={handleManualCreateClick}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Ticket
              </button>
          </div>
      </div>

      {/* Kanban Board Area */}
      <div className="max-w-8xl mx-auto overflow-x-auto"> {/* Allow horizontal scrolling if columns overflow */}
          <div className="inline-flex space-x-6 pb-4"> {/* Use inline-flex for horizontal columns */}

              {/* Map over statuses to create columns */}
              {kanbanStatuses.map(status => (
                <div key={status} className="w-80 flex-shrink-0 bg-white rounded-lg shadow-md p-4 flex flex-col"> {/* Fixed width column */}
                    {/* Column Header */}
                    <h2 className={`text-lg font-semibold mb-4 pb-2 text-black border-b ${statusColors[status].replace('bg-', 'border-').replace('text-', '')}`}> {/* Dynamic border color */}
                       {status} ({filteredTickets.filter(ticket => ticket.status === status).length}) {/* Count tickets in this status */}
                    </h2>

                    {/* Tickets in this column (Sorted) */}
                    {/* MODIFIED: Changed overflow-y-hidden to overflow-y-auto */}
                    <div className="flex-grow space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]"> {/* Added vertical scrollbar when content overflows */}
                        {sortTickets(filteredTickets.filter(ticket => ticket.status === status)).map(ticket => (
                            // Ticket Card
                            <div
                                key={ticket.id}
                                className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 hover:border-blue-300 cursor-pointer"
                                onClick={() => handleTicketClick(ticket.id)} // Simulate detail view
                            >
                                {/* ... (ticket card content) ... */}
                                <div className="font-semibold text-gray-800 mb-1 truncate">{ticket.subject}</div>
                                <div className="text-sm text-gray-600 mb-2">ID: {ticket.id} | Channel: {ticket.channel}</div>
                                <div className="text-sm text-gray-600 mb-2">Department: {ticket.department}</div>
                                <div className="text-sm text-gray-600 mb-2">Assigned: {ticket.assignedTo || 'Unassigned'}</div>
                                <div className={`text-sm ${priorityColors[ticket.priority]} mb-2`}>
                                Priority: {ticket.priority}
                                </div>
                                {ticket.slaStatus && (
                                    <div className={`text-xs ${slaColors[ticket.slaStatus]} mb-2 flex items-center`}>
                                        <AlertTriangle className="w-3 h-3 mr-1" /> {ticket.slaStatus}
                                    </div>
                                )}
                                <div className="text-xs text-gray-500">Last Update: {new Date(ticket.updatedAt).toLocaleString()}</div>

                                <div className="mt-3 flex justify-between items-center text-sm">
                                    <select
                                        value={ticket.status}
                                        onChange={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            handleStatusChange(ticket.id, e.target.value as Ticket['status']);
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Stop click propagation from select
                                        className="border rounded px-1 py-0 text-xs text-gray-600 bg-white"
                                    >
                                        {Object.keys(statusColors).map(statusOption => (
                                            <option key={statusOption} value={statusOption}>{statusOption}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            const newAssignee = prompt(`Assign ${ticket.id} to:`, ticket.assignedTo || '');
                                            if (newAssignee !== null) {
                                                handleAssignChange(ticket.id, newAssignee === '' ? null : newAssignee);
                                            }
                                        }}
                                        className="px-2 py-1 text-xs bg-blue-600 rounded hover:bg-gray-600 text-white"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        ))}
                       {sortTickets(filteredTickets.filter(ticket => ticket.status === status)).length === 0 && (
                            <div className="text-center text-gray-500 italic py-4">
                                No tickets in this status.
                            </div>
                        )}
                    </div>
                </div>
            ))}

          </div>
      </div>


      {/* --- Manual Ticket Creation Modal (Simulated) --- */}
      {isManualCreationModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"> {/* Added z-50 */}
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-4 text-blue-900">Create New Ticket</h2>
                  <form onSubmit={handleManualFormSubmit}>
                      <div className="mb-4">
                          <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">Subject:</label>
                          <input
                              type="text"
                              id="subject"
                              name="subject"
                              value={newTicketFormData.subject}
                              onChange={handleManualFormChange}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              required
                          />
                      </div>
                       <div className="mb-4">
                         <label htmlFor="channel" className="block text-gray-700 text-sm font-bold mb-2">Channel:</label>
                          <select
                              id="channel"
                              name="channel"
                              value={newTicketFormData.channel}
                              onChange={handleManualFormChange}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              required
                           >
                               <option value="">Select Channel</option>
                               <option value="Phone">Phone</option>
                               <option value="Email">Email</option>
                               <option value="Chat">Chat</option>
                               <option value="Web Form">Web Form</option>
                               <option value="Social Media">Social Media</option>
                               <option value="Other">Other</option>
                           </select>
                      </div>
                      <div className="mb-4">
                          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                          <textarea
                              id="description"
                              name="description"
                              value={newTicketFormData.description}
                              onChange={handleManualFormChange}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                          ></textarea>
                      </div>
                      <div className="flex items-center justify-between">
                          <button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                              Create Ticket
                          </button>
                          <button
                              type="button"
                              onClick={handleManualModalClose}
                              className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
                          >
                              Cancel
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      {/* --- End Manual Ticket Creation Modal --- */}

       {/* Incoming Call Simulation Popup */}
        {showIncomingCallPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center w-full max-w-sm"> {/* Added max-w-sm for better sizing */}
                    {callSimulationPhase === 'ringing' && (
                        <>
                            {/* Placeholder for Client Picture */}
                            <img
                                src="https://placehold.co/100x100/E0E0E0/000000?text=Client" // Placeholder image URL
                                alt="Client Placeholder"
                                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" // Styled for a profile picture
                            />

                            {/* Client Name (Placeholder) */}
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Incoming Call from: Lauvigne</h3> {/* Placeholder Name */}

                             {/* Client Number (Placeholder) */}
                            <p className="text-gray-600 text-sm mb-2">Number: +1 (555) 123-4567</p> {/* Placeholder Number */}

                            {/* "Customer in database" text */}
                            <p className="text-green-700 font-medium mb-4">The customer is already on our database.</p>

                            <Phone className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ringing...</h3> {/* Changed text to Ringing */}

                            {/* Answer/End buttons (for simulation they just close the popup for now) */}
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowIncomingCallPopup(false)} // Simulate answering/ending by closing
                                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Answer
                                </button>
                                <button
                                    onClick={() => {
                                        if (callTimerRef.current) clearTimeout(callTimerRef.current); // Clear timers
                                        setShowIncomingCallPopup(false);
                                        setCallSimulationPhase(null);
                                        console.log('Call simulation ended by user.');
                                    }}
                                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    End
                                </button>
                            </div>
                        </>
                    )}

                    {callSimulationPhase === 'ai_answering' && (
                        <>
                             {/* Placeholder for Client Picture (same as above) */}
                            <img
                                src="https://placehold.co/100x100/E0E0E0/000000?text=Client" // Placeholder image URL
                                alt="Client Placeholder"
                                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" // Styled for a profile picture
                            />
                             {/* Client Name (Placeholder) */}
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Call from: John Doe</h3> {/* Placeholder Name */}
                             {/* Client Number (Placeholder) */}
                            <p className="text-gray-600 text-sm mb-4">Number: +1 (555) 123-4567</p> {/* Placeholder Number */}


                            <Mic className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" /> {/* Using Mic icon for AI */}
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Agent Answering...</h3>
                            <p className="text-gray-600">The AI is currently attempting to resolve the concern.</p>
                            {/* No buttons here, it transitions automatically */}
                        </>
                    )}
                </div>
            </div>
        )}
        {/* END ADDED: Incoming Call Simulation Popup */}


       {/* --- Detailed Ticket View Modal (Including AI Processing and Conversation) --- */}
       {selectedTicket && (
           // Increased size: max-w-screen-xl takes most of the width, max-h-[90vh] for height
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-screen-3xl max-h-[95vh] overflow-y-auto"> {/* Increased size classes */}
                   {/* Modal Header */}
                   <div className="flex justify-between items-center border-b pb-3 mb-4">
                       <h2 className="text-2xl font-bold text-blue-900">Ticket Details: {selectedTicket.id}</h2>
                       <button onClick={handleDetailedViewClose} className="text-gray-500 hover:text-gray-700">
                           <XCircle className="w-6 h-6" />
                       </button>
                   </div>

                   {/* Ticket Details (Original Kanban Modal Content) */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                       <div>
                           <p className="text-sm font-semibold text-gray-600">Subject:</p>
                           <p className="text-gray-800">{selectedTicket.subject}</p>
                       </div>
                       <div>
                            <p className="text-sm font-semibold text-gray-600">Status:</p>
                           <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedTicket.status]}`}>
                                {selectedTicket.status}
                            </span>
                       </div>
                        {/* MODIFIED: Priority Display to Dropdown */}
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Priority:</p>
                            <select
                                 value={selectedTicket.priority}
                                 onChange={(e) => {
                                     // Update the priority of the selected ticket in the main tickets state
                                     setTickets(tickets.map(t =>
                                         t.id === selectedTicket.id ? { ...t, priority: e.target.value as Ticket['priority'], updatedAt: new Date().toISOString() } : t
                                     ));
                                     console.log(`Simulating priority change for ${selectedTicket.id} to ${e.target.value}`);
                                 }}
                                 className={`border rounded px-2 py-1 text-sm ${priorityColors[selectedTicket.priority]}`} // Apply priority color
                             >
                                {Object.keys(priorityColors).map(priorityOption => (
                                     <option key={priorityOption} value={priorityOption}>
                                         {priorityOption}
                                      </option>
                                 ))}
                             </select>
                        </div>
                        {/* END MODIFIED: Priority Display to Dropdown */}
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Assigned To:</p>
                            <p className="text-gray-800">{selectedTicket.assignedTo || 'Unassigned'} ({selectedTicket.department})</p> {/* Display department here too */}
                        </div>
                         {/* ADDED: Display Department - REMOVED as it's now in Assigned To line */}
                         {/* <div>
                             <p className="text-sm font-semibold text-gray-600">Department:</p>
                             <p className="text-gray-800">{selectedTicket.department}</p>
                         </div> */}
                         {/* END ADDED */}
                         <div>
                            <p className="text-sm font-semibold text-gray-600">Channel:</p>
                            <p className="text-gray-800">{selectedTicket.channel}</p>
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-gray-600">Created At:</p>
                           <p className="text-gray-800">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                        </div>
                         <div>
                            <p className="text-sm font-semibold text-gray-600">Last Updated:</p>
                           <p className="text-gray-800">{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
                        </div>
                         {/* ADDED: SLA Status Display */}
                         <div>
                            <p className="text-sm font-semibold text-gray-600">SLA Status:</p>
                              {selectedTicket.slaStatus ? (
                                  <span className={`text-gray-800 ${slaColors[selectedTicket.slaStatus]}`}>
                                      {selectedTicket.slaStatus}
                                  </span>
                              ) : (
                                  <span className="text-gray-500 italic">N/A</span>
                              )}
                         </div>
                         {/* END ADDED */}
                          {/* ADDED: Escalation Level Display */}
                         <div>
                             <p className="text-sm font-semibold text-gray-600">Escalation Level:</p>
                             <span className="text-gray-800">
                                {selectedTicket.escalationLevel || 'None'}
                             </span>
                         </div>
                         {/* END ADDED */}
                         {/* ADDED: Merged Into Display */}
                          {selectedTicket.mergedInto && (
                              <div>
                                   <p className="text-sm font-semibold text-gray-600">Merged Into:</p>
                                   <span className="text-gray-800 italic">
                                       {selectedTicket.mergedInto}
                                   </span>
                               </div>
                          )}
                       {/* END ADDED */}
                   </div>


                   {/* --- AI Processing Area (Moved from page.tsx) + Conversation (5 Columns) --- */}
                   {/* Use the five-column grid structure inside the modal */}
                   <main className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6"> {/* MODIFIED: lg:grid-cols-5 */}

                     {/* ADDED: First Column: Conversation History */}
                    <div className="flex flex-col gap-6 w-full lg:col-span-1"> {/* Explicitly set column span */}
                        <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full flex flex-col"> {/* Use flex-col for chat layout */}
                            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b pb-2">Conversation</h2>
                            {/* Conversation Messages Display Area */}
                            <div id="conversation-area" className="flex-grow overflow-y-auto h-full space-y-4 pr-2"> {/* Added space-y for message spacing, pr for scrollbar */}
                                {currentConversation.length > 0 ? (
                                    currentConversation.map((message, index) => (
                                        <div key={index} className={`flex ${message.sender === 'Agent' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'Agent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                <p className="text-sm">{message.text}</p>
                                                 <p className="text-xs text-right mt-1 opacity-80">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> {/* Display time */}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 italic">No conversation history for this ticket.</div>
                                )}
                            </div>
                        </section>
                    </div> {/* End First Column */}


                        {/* Original First Column (now Second): Customer Ticket and Ticket Summary */}
                        <div className="flex flex-col gap-6 w-full lg:col-span-1"> {/* Explicitly set column span */}
                            {/* Customer Ticket Input/Real-time Transcript */}
                            <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                                 <h2 className="text-xl font-semibold text-blue-700 mb-4">Customer Ticket</h2>
                                 {sttError && ( // Display STT errors within the modal
                                    <p className="text-red-600 mb-2">{sttError}</p>
                                 )}
                                 {/* Use clientConcern for the text area, append interim transcript */}
                                 <textarea
                                    id="client-concern-textarea" // Added ID
                                    className="w-full h-50 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                     placeholder="Speak into the microphone or type customer ticket text here..."
                                     // Display finalized transcript plus current interim result
                                     value={clientConcern + interimTranscript}
                                    onChange={(e) => {
                                     // Only allow editing if not recording
                                         if (!isRecording) {
                                             setClientConcern(e.target.value);
                                         }
                                    }}
                                    disabled={isProcessing || isRecording} // Disable if processing or recording
                                 ></textarea>
                                 <div className="flex justify-between items-center mt-4 w-full gap-2"> {/* Adjusted layout */}
                                     {/* Speech-to-Text Button */}
                                     <button
                                         onClick={handleToggleSpeechToText}
                                          className={`flex items-center text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                                          // Disable if processing OR if the STT API is NOT supported/initialized.
                                          disabled={isProcessing || !isSTTReady || !recognitionRef.current}
                                      >
                                          {isRecording ? (
                                              <>
                                                  <Mic className="w-4 h-4 mr-2 animate-pulse" /> Stop Recording
                                              </>
                                          ) : (
                                                <>
                                                    {/* Show a loading state for the button if STT is not ready */}
                                                   {isSTTReady ? (
                                                       <>
                                                             <Mic className="w-4 h-4 mr-2" /> Start Recording
                                                       </>
                                                   ) : (
                                                        'Loading STT...'
                                                   )}
                                               </>
                                           )}
                                         </button>

                                      {/* Process Ticket button */}
                                     <button
                                         onClick={handleProcessTicket}
                                         className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                         // Disable if processing or if there is no text (final or interim)
                                         // Allow processing even if recording is ongoing.
                                         disabled={isProcessing || !(clientConcern + interimTranscript).trim()}
                                     >
                                         {isProcessing ? 'Processing...' : 'Process Ticket'}
                                     </button>
                                 </div>
                            </section>

                            {/* Ticket Summary Display */}
                             <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                                <h2 className="text-xl font-semibold text-blue-700 mb-4">Ticket Summary</h2>
                                 <div className="w-full h-50 p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto whitespace-pre-wrap flex-grow">
                                      {processingError ? (
                                          <p className="text-red-600">{processingError}</p>
                                      ) : (
                                         summary || 'AI-generated summary will appear here after processing the ticket.'
                                      )}
                                   </div>
                            </section>
                        </div> {/* End First Column */}

                    {/* Second Column: Knowledge Base Suggestions */}
                    <div className="flex flex-col gap-6 w-full lg:col-span-1">
                         <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                            <h2 className="text-xl font-semibold text-blue-700 mb-4">Knowledge Base Suggestions</h2>
                            <div className="w-full p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto h-12/14 flex-grow">
                                 {suggestedKB.length > 0 && suggestedKB[0].id === 'KB-None' ? (
                                      <p className="text-gray-600 italic">{suggestedKB[0].title}</p>
                                 ) : suggestedKB.length > 0 ? (
                                     <ul className="w-full">
                                         {suggestedKB.map(kb => (
                                             <li key={kb.id} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0 w-full">
                                                 <p className="font-semibold text-blue-700">{kb.title}</p>
                                                  <p className="text-sm text-gray-600 italic">{kb.content}</p>
                                             </li>
                                         ))}
                                     </ul>
                                 ) : (
                                     'Relevant KB articles will appear here after processing.'
                                 )}
                             </div>
                        </section>
                    </div> {/* End Second Column */}

                    {/* Third Column: Response Suggestions */}
                    <div className="flex flex-col gap-6 w-full lg:col-span-1">
                        <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                            <h2 className="text-xl font-semibold text-blue-700 mb-4">Response Suggestions</h2>
                            <div className="w-full h-12/14 p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto flex-grow">
                                 {suggestedReplies.length > 0 ? (
                                     <ul className="list-disc pl-5 w-full">
                                         {suggestedReplies.map((reply, index) => (
                                             <li
                                                 key={index}
                                                 className="mb-2 cursor-pointer text-blue-700 hover:underline w-full"
                                                 onClick={() => handleSuggestionClick(reply)}
                                             >
                                                 {reply}
                                             </li>
                                         ))}
                                     </ul>
                                 ) : (
                                     'AI-generated response suggestions will appear here after processing the ticket.'
                                 )}
                             </div>
                        </section>
                    </div> {/* End Third Column */}

                    {/* Fourth Column: Compose Reply */}
                     <div className="flex flex-col gap-6 w-full lg:col-span-1">
                     <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Compose Reply</h2>
                        <textarea
                            className="w-full h-11/14 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            placeholder="Compose your final reply here..."
                            value={composeReply}
                            onChange={(e) => setComposeReply(e.target.value)}
                         ></textarea>
                         <div className="flex justify-end space-x-4 mt-4 w-full">
                             <button
                                 onClick={handleClearCompose}
                                 className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                             >
                                 <Eraser className="w-4 h-4 mr-1" /> Clear
                            </button>
                             <button
                                 onClick={handleSendAgentReply} // MODIFIED: Use the new send handler
                                 className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!composeReply.trim() || !selectedTicket} // Disable if empty or no ticket selected
                                 >
                                     <Send className="w-4 h-4 mr-1" /> Send Reply
                                 </button>
                             </div>
                         </section>
                         </div> {/* End Fourth Column */}

                     </main>
                     {/* --- End AI Processing Area + Conversation --- */}


                    {/* Interaction History Section (Keep this separate from the main conversation chat) */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b pb-2">Interaction History (Emails, Call Logs, etc.)</h3>
                        <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto"> {/* Added max-height and overflow */}
                            {hardcodedInteractionHistory.length > 0 ? (
                                <ul>
                                    {hardcodedInteractionHistory.map(interaction => (
                                        <li key={interaction.id} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0 text-sm text-gray-700">
                                            <span className="font-semibold">{interaction.type}:</span> {interaction.summary}
                                             <p className="text-xs text-gray-500 mt-1">{formatHistoryDate(interaction.timestamp)}</p> {/* Display formatted date */}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-gray-500 italic">No interaction history available.</div>
                            )}
                        </div>
                    </div>
                    {/* END MODIFIED: Interaction History Section */}


                    {/* MODIFIED: Notes Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b pb-2">Notes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Public Notes Textarea */}
                            <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm font-semibold text-gray-600 mb-2">Public Notes:</p>
                                <textarea
                                     className="w-full h-32 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                     placeholder="Add public notes here..."
                                     value={publicNotes}
                                     onChange={(e) => setPublicNotes(e.target.value)}
                                 ></textarea>
                            </div>
                            {/* Private Notes Textarea */}
                            <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm font-semibold text-gray-600 mb-2">Private Notes:</p>
                                <textarea
                                     className="w-full h-32 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                     placeholder="Add private notes here..."
                                     value={privateNotes}
                                     onChange={(e) => setPrivateNotes(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        {/* Conceptual Save Notes Button */}
                         <div className="flex justify-end mt-4">
                            <button
                                 onClick={() => {
                                     // TODO: Implement saving notes to state/backend
                                     console.log("Simulating saving notes:", { publicNotes, privateNotes });
                                     alert("Notes saved (simulated)!");
                                     // In a real app, you'd update the ticket object in your state/database
                                     // For this demo, you might update the selectedTicket object locally
                                 }}
                                 className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                             >
                                 Save Notes
                            </button>
                         </div>
                    </div>
                    {/* END MODIFIED: Notes Section */}


                    {/* ADDED: Other Actions Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b pb-2">Other Actions</h3>
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Escalate Button */}
                            <button
                                onClick={handleEscalateTicket}
                                 className="flex items-center bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!selectedTicket}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" /> Escalate Ticket
                            </button>

                            {/* Merge Button */}
                            {!showMergeInput ? (
                                <button
                                    onClick={handleMergeTickets}
                                    className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!selectedTicket || selectedTicket.mergedInto !== undefined} // Disable if no ticket or already merged
                                >
                                    <Merge className="w-4 h-4 mr-2" /> Merge Ticket
                                </button>
                            ) : (
                                 // Merge Input Field and Confirm Button
                                 <div className="flex items-center gap-2">
                                   <input
                                         type="text"
                                         placeholder="Merge into Ticket ID..."
                                         value={mergeTicketId}
                                         onChange={(e) => setMergeTicketId(e.target.value)}
                                         className="p-2 border rounded-md text-gray-700 w-40"
                                     />
                                      <button
                                          onClick={handleConfirmMerge}
                                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={!mergeTicketId.trim()}
                                      >
                                          Confirm Merge
                                      </button>
                                       <button
                                           onClick={() => { setShowMergeInput(false); setMergeTicketId(''); }}
                                           className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                                       >
                                          Cancel
                                       </button>
                                   </div>
                            )}

                             {/* Simulate Close Ticket Button */}
                             <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                 disabled={!selectedTicket} // Disable if no ticket selected
                             >
                                Close Ticket (Simulated)
                             </button>

                             {/* TODO: Add other action buttons like Reply, etc. here if not handled elsewhere */}
                         </div>
                    </div>
                    {/* END ADDED: Other Actions Section */}


               </div>
           </div>
       )}
       {/* --- End Detailed Ticket View Modal --- */}

       {/* ADDED: Related Concerns Section (Rendered below the main Kanban board, always visible) */}
        <div className="max-w-screen-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md"> {/* Container for the related concerns section */}
            <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">
                Related Concerns {selectedTicket ? `for ${selectedTicket.id}` : ' '} {/* Update title based on selected ticket */}
            </h3>

            {/* Conditional rendering based on whether a ticket is selected or if related tickets are found */}
            {Object.keys(relatedTicketsByDepartment).length > 0 ? (
                <>
                    {/* Display message indicating which ticket is being used for related concerns */}
                    <p className="text-gray-700 mb-4">
                         {selectedTicket
                             ? `Showing concerns related to ticket ${selectedTicket.id}. Select tickets below to send a tailored response.`
                             : 'Showing related concerns. Select tickets below to send a tailored response.'
                       }
                    </p>

                    {/* Related Tickets Grouped by Department */}
                    <div className="space-y-6">
                        {Object.entries(relatedTicketsByDepartment).map(([department, tickets]) => (
                            <div key={department} className="border rounded-lg p-4 bg-blue-50">
                                <h4 className="text-lg font-semibold text-blue-800 mb-3">{department}</h4>
                                <div className="space-y-3">
                                    {tickets.map(ticket => (
                                        <div key={ticket.id} className="flex items-center bg-white p-3 rounded-md shadow-sm border border-blue-100">
                                             <input
                                                 type="checkbox"
                                                 className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                 checked={selectedRelatedTicketIds.includes(ticket.id)}
                                                 onChange={(e) => handleRelatedCheckboxChange(ticket.id, e.target.checked)} // Use the local handler
                                             />
                                             <div>
                                                <div className="font-semibold text-gray-800 text-sm">{ticket.subject} (ID: {ticket.id})</div>
                                                 <div className="text-xs text-gray-600">Channel: {ticket.channel} | Status: {ticket.status}</div>
                                                 <div className="text-xs text-gray-600">Assigned: {ticket.assignedTo || 'Unassigned'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bulk Action Button */}
                    <div className="mt-6 flex justify-end items-center space-x-4">
                         {bulkReplyStatus && (
                             <p className={`text-sm italic ${bulkReplyStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                 {bulkReplyStatus}
                             </p>
                         )}
                        <button
                            onClick={handleSendBulkTailoredResponse} // Use the local handler
                            className="flex items-center bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={selectedRelatedTicketIds.length === 0 || isSendingBulkReply}
                        >
                            {isSendingBulkReply ? 'Sending...' : `Send Tailored Response to ${selectedRelatedTicketIds.length} Ticket(s)`}
                        </button>
                    </div>
                </>
            ) : (
                // Display message if no related tickets are found (either initially or for a selected ticket)
                <p className="text-gray-700 italic text-center py-4">No related concerns found for the moment.</p>
            )}
        </div>
       {/* --- End Related Concerns Section --- */}


     </div>
  );
}