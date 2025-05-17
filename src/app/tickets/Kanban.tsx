// src/app/tickets/Kanban.tsx (This file now contains the Kanban and the AI Processing Modal)

'use client'; // This page uses client-side state and interactions

import React, { useState, useMemo, useEffect, useRef } from 'react'; // Import hooks
import { PlusCircle, Filter, ArrowUpDown, XCircle, Send, Eraser, Mic, Phone } from 'lucide-react'; // Import icons
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'; // Import Gemini library
import { hardcodedKnowledgeBase, hardcodedDepartments } from '../lib/hardcodedData'; // Import hardcoded data


// --- WARNING: SECURITY RISK ---
// Your API key should NOT be used here for Gemini calls in the final real-time version.
// Gemini calls should be made from your secure backend.
// For this combined modal view, keeping it client-side as before, but the warning remains.
// Replace with your actual API key or load from environment variables securely on the backend.
const apiKey = "AIzaSyC1NaNuNzIATe-tlPbO53P7S08_nIT4ZrM";

if (!apiKey) {
    console.error("GOOGLE_API_KEY environment variable not set. Gemini calls will not work.");
    // You might want to display a user-facing error message if the key is missing
}

// Initialize the Generative Model (only if apiKey is available)
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null; // Using gemini-1.5-flash


// Helper function to format KB articles for the prompt
const formatKnowledgeBase = (kb: typeof hardcodedKnowledgeBase) => {
    if (!kb || kb.length === 0) return "No knowledge base articles available.";
    return kb.map(article => `## ${article.title}\n${article.content}`).join('\n\n');
};

// Format the entire hardcoded KB for the prompt
const formattedKB = formatKnowledgeBase(hardcodedKnowledgeBase);

// Helper function to format departments/agents for the prompt
const formatDepartmentsForPrompt = (departments: typeof hardcodedDepartments) => {
     if (!departments || departments.length === 0) return "No departments available.";
     return departments.map(dept =>
         `Department: ${dept.name}\nAgents: ${dept.agents.join(', ')}\nDescription: ${dept.description}`
     ).join('\n\n');
};

// Format the entire hardcoded departments data for the prompt
const formattedDepartments = formatDepartmentsForPrompt(hardcodedDepartments);


// Declare SpeechRecognition globally to avoid TypeScript errors
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}


// --- Hardcoded Data ---
// This simulates data that would eventually come from your Supabase database

interface Message {
    sender: 'Customer' | 'Agent';
    text: string;
    timestamp: string; // ISO date string
}

interface Ticket {
  id: string;
  subject: string;
  status: 'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: string | null;
  channel: 'Phone' | 'Email' | 'Chat' | 'Web Form' | 'Social Media' | 'Other';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastMessageAt: string; // ISO date string
  description?: string; // Added description field for detail view
  publicNotes?: string; // ADDED: Public notes field
  privateNotes?: string; // ADDED: Private notes field
  conversation?: Message[]; // ADDED: Conversation history
}

// ADDED: Hardcoded Interaction History (Universal for demo - distinct from conversation)
const hardcodedInteractionHistory = [
    { id: 1, type: 'Email Received', timestamp: '2023-10-26T10:00:00Z', summary: 'Customer reported login issue.' },
    { id: 2, type: 'Agent Note', timestamp: '2023-10-26T10:15:00Z', summary: 'Checked account status, no lockouts found.' },
    { id: 3, type: 'Email Sent', timestamp: '2023-10-26T10:30:00Z', summary: 'Sent password reset instructions.' },
     { id: 4, type: 'Phone Call', timestamp: '2023-10-26T11:00:00Z', summary: 'Follow-up call from customer, still unable to login.' },
     { id: 5, type: 'Agent Note', timestamp: '2023-10-26T11:10:00Z', summary: 'Advised customer to clear browser cache.' },
    // Add more sample history entries as needed
];

// Add a helper function to format dates nicely for display
const formatHistoryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

const initialTickets: Ticket[] = [
  {
    id: 'T001',
    subject: 'Cannot log in to account',
    status: 'Open',
    priority: 'Urgent',
    assignedTo: 'Agent A',
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
  },
  {
    id: 'T002',
    subject: 'Question about billing cycle',
    status: 'New',
    priority: 'Medium',
    assignedTo: null,
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
  },
   {
    id: 'T003',
    subject: 'Product feature request',
    status: 'Open',
    priority: 'Low',
    assignedTo: 'Agent B',
    channel: 'Chat',
    createdAt: '2023-10-26T09:30:00Z',
    updatedAt: '2023-10-26T14:00:00Z',
    lastMessageAt: '2023-10-26T14:00:00Z',
    description: 'Customer would like to request a new feature for the product, specifically the ability to export data in a different format.',
    conversation: [], // Empty conversation initially
     publicNotes: 'Forward to product team.',
    privateNotes: '',
  },
   {
    id: 'T004',
    subject: 'Complaint about service',
    status: 'Pending',
    priority: 'High',
    assignedTo: 'Agent A',
    channel: 'Phone', // Simulating a phone ticket received as hardcoded text initially
    createdAt: '2023-10-25T16:00:00Z',
    updatedAt: '2023-10-26T09:00:00Z',
    lastMessageAt: '2023-10-26T09:00:00Z',
    description: 'Customer is unhappy with the response time on a previous ticket and is requesting escalation.',
    conversation: [], // Empty conversation initially
     publicNotes: '',
    privateNotes: 'Agent A needs to call customer directly.',
  },
   {
    id: 'T005',
    subject: 'Follow up on T001',
    status: 'New', // Simulating a follow-up coming in as new
    priority: 'Urgent', // Duplicates of high priority are urgent
    assignedTo: null,
    channel: 'Email',
    createdAt: '2023-10-26T15:00:00Z',
    updatedAt: '2023-10-26T15:00:00Z',
    lastMessageAt: '2023-10-26T15:00:00Z',
    description: 'Customer is following up on ticket T001 regarding their login issue. Still unable to access account.',
    conversation: [], // Empty conversation initially
    publicNotes: '',
    privateNotes: '',
  },
    {
    id: 'T006',
    subject: 'Issue with payment processing',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Agent C',
    channel: 'Chat',
    createdAt: '2023-10-26T12:00:00Z',
    updatedAt: '2023-10-26T13:00:00Z',
    lastMessageAt: '2023-10-26T13:00:00Z',
    description: 'Customer reported an error while trying to complete a payment online. Transaction failed.',
    conversation: [], // Empty conversation initially
     publicNotes: '',
    privateNotes: '',
  },
   {
    id: 'T007',
    subject: 'Request for refund status',
    status: 'Resolved',
    priority: 'Medium',
    assignedTo: 'Agent B',
    channel: 'Email',
    createdAt: '2025-05-16T10:00:00Z', // Updated date for testing
    updatedAt: '2025-05-17T11:00:00Z', // Updated date for testing
    lastMessageAt: '2025-05-17T11:00:00Z', // Updated date for testing
    description: 'Customer is inquiring about the status of their refund request submitted last week.',
    conversation: [], // Empty conversation initially
     publicNotes: '',
    privateNotes: '',
  },
];
// --- End Hardcoded Data ---

// --- Helper for Status Colors (Tailwind classes) ---
const statusColors: Record<Ticket['status'], string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Open': 'bg-green-100 text-green-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Pending': 'bg-orange-100 text-orange-800',
  'Resolved': 'bg-teal-100 text-teal-800',
  'Closed': 'bg-gray-200 text-gray-800',
};

// --- Helper for Priority Colors (Tailwind classes) ---
const priorityColors: Record<Ticket['priority'], string> = {
  'Low': 'text-green-600 font-medium',
  'Medium': 'text-yellow-600 font-medium',
  'High': 'text-orange-600 font-semibold',
  'Urgent': 'text-red-600 font-bold',
};

// Define the order of columns/statuses for the Kanban board
const kanbanStatuses: Ticket['status'][] = ['New', 'Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

// ADDED: Helper function to add a new hardcoded ticket with AI assignment
const addNewHardcodedTicket = async (setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>, model: GenerativeModel | null, initialConcern: string = 'Automated transcription: Customer called with a general inquiry.') => {
     // Generate a more robust unique ID for demo purposes
     const newTicketId = `T${Date.now().toString().slice(-6)}-${Math.random().toFixed(3).slice(-3)}`;
     const now = new Date().toISOString();

     let assignedDepartmentAndAgent = 'Unassigned'; // Default assignment

     if (model) {
         try {
             // --- Prompt Gemini for Automated Assignment ---
             const assignmentPrompt = `Analyze the following customer concern and assign it to the most appropriate department and agent from the list provided.

Return ONLY the assigned department and agent in the format: Department: [Department Name], Agent: [Agent Name]. If no specific agent seems appropriate, just return the department (e.g., Department: [Department Name], Agent: Unassigned). If the concern does not fit any department, return Department: Other, Agent: Unassigned.

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
                  assignedDepartmentAndAgent = `${department}${agent && agent.toLowerCase() !== 'unassigned' ? ' - ' + agent : ''}`;

                  // Optional: Validate if the assigned department/agent exists in your hardcoded data
                  const foundDept = hardcodedDepartments.find(d => d.name.toLowerCase() === department.toLowerCase());
                   if (!foundDept) {
                       console.warn(`Gemini assigned a department not in hardcoded list: ${department}`);
                        // Fallback or handle unknown department
                        assignedDepartmentAndAgent = `Other - ${agent}`;
                   } else if (agent.toLowerCase() !== 'unassigned' && !foundDept.agents.some(a => a.toLowerCase() === agent.toLowerCase())) {
                        console.warn(`Gemini assigned an agent not in ${department} department: ${agent}`);
                         // Fallback or handle unknown agent in department
                         assignedDepartmentAndAgent = `${foundDept.name} - Unassigned`; // Use validated department name
                   }


             } else {
                 console.warn('Could not parse assignment from Gemini response:', assignmentText);
                  assignedDepartmentAndAgent = 'Assignment Failed'; // Indicate assignment failure
             }

         } catch (error: any) {
             console.error('Error during AI assignment:', error);
              assignedDepartmentAndAgent = 'Assignment Error'; // Indicate assignment error
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
         channel: 'Phone', // Simulated phone call channel
         createdAt: now,
         updatedAt: now,
         lastMessageAt: now,
         description: initialConcern, // Use the initial concern text as description
         conversation: [{ sender: 'Customer', text: initialConcern, timestamp: now }], // Initial customer message
         publicNotes: '',
         privateNotes: `Ticket created automatically by AI after call. Initial Assignment: ${assignedDepartmentAndAgent}`,
     };

     setTickets(prevTickets => [...prevTickets, simulatedNewTicket]);
     console.log('Simulating adding new ticket:', simulatedNewTicket);
     alert(`New ticket ${newTicketId} automatically created! Assigned to: ${assignedDepartmentAndAgent}`); // Notify the agent
};


export default function TicketManagementPage() {
  // --- State for Ticket Data and UI Controls ---
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  // Filter and Sort state can still be used, but might apply *within* columns or globally
  const [filterStatus, setFilterStatus] = useState<string>('All'); // Global filter (optional for Kanban)
  const [sortBy, setSortBy] = useState<keyof Ticket>('createdAt'); // Field to sort by within columns
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // asc or desc
  const [isManualCreationModalOpen, setIsManualCreationModalOpen] = useState(false);
  const [newTicketFormData, setNewTicketFormData] = useState({ subject: '', channel: '', description: '' });

  // --- State for Detailed Ticket View Modal ---
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const selectedTicket = useMemo(() => {
      return tickets.find(ticket => ticket.id === selectedTicketId);
  }, [selectedTicketId, tickets]); // Recompute when selectedTicketId or tickets change

  // ADDED: State for editable notes in the modal
    const [publicNotes, setPublicNotes] = useState('');
    const [privateNotes, setPrivateNotes] = useState('');

    // ADDED: State for conversation history in the modal
    const [currentConversation, setCurrentConversation] = useState<Message[]>([]);


  // --- State for AI Processing (Moved from page.tsx) ---
  const [clientConcern, setClientConcern] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState('');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [suggestedKB, setSuggestedKB] = useState<typeof hardcodedKnowledgeBase>([]);
  const [composeReply, setComposeReply] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);

   // ADDED: State for call simulation popup
    const [showIncomingCallPopup, setShowIncomingCallPopup] = useState(false);
    const [callSimulationPhase, setCallSimulationPhase] = useState<'ringing' | 'ai_answering' | null>(null);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null); // Use useRef for the timer ID

  // --- State for Actual Speech-to-Text (Moved from page.tsx) ---
  const [isRecording, setIsRecording] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState(''); // State to hold interim results
  const [isSTTReady, setIsSTTReady] = useState(false); // Track if STT API is initialized

  // Use useRef to hold the SpeechRecognition instance (Moved from page.tsx)
  const recognitionRef = useRef<any | null>(null);

  // ADDED: Handle simulating an incoming call
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
 useEffect(() => {
     return () => {
         if (callTimerRef.current) {
             clearTimeout(callTimerRef.current);
         }
     };
 }, []); // Empty dependency array to run only on mount and unmount


  // --- Effect to Initialize SpeechRecognition (Moved from page.tsx) ---
  // This effect will now run when the Kanban component mounts.
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
              setIsRecording(false);
              setInterimTranscript(''); // Clear any leftover interim transcript
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
        }
    }, [selectedTicket]); // Rerun this effect when selectedTicket changes


  // --- Event Handlers (Kanban Specific) ---
  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(event.target.value);
  };

  const handleSortChange = (field: keyof Ticket) => {
    const order = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'; // Toggle order
    setSortBy(field);
    setSortOrder(order);
  };

  const handleTicketClick = (ticketId: string) => {
    // Set the selected ticket ID and open the modal
    setSelectedTicketId(ticketId);
  };

  const handleDetailedViewClose = () => {
      // Close the modal by clearing the selected ticket ID
      setSelectedTicketId(null);
       // The useEffect for selectedTicket handles clearing AI state
  };


  const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
      // TODO: Replace with backend API call to update status in Supabase
      setTickets(tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } : ticket
      ));
       console.log(`Simulating status change for ${ticketId} to ${newStatus}`);
  };

   const handleAssignChange = (ticketId: string, newAssignee: string | null) => {
      // TODO: Replace with backend API call to update assignment in Supabase
      setTickets(tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, assignedTo: newAssignee, updatedAt: new Date().toISOString() } : ticket
      ));
      console.log(`Simulating assignment change for ${ticketId} to ${newAssignee}`);
   };


  // --- Manual Ticket Creation ---
   const handleManualCreateClick = () => {
       setIsManualCreationModalOpen(true);
   };

   const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
       const { name, value } = e.target;
       setNewTicketFormData(prevState => ({ ...prevState, [name]: value }));
   };

   const handleManualFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       // TODO: Replace with backend API call to create ticket in Supabase
       // Assign a simple unique ID for hardcoded data
       const newTicketId = `T${(tickets.length + 1).toString().padStart(3, '0')}`;
       const now = new Date().toISOString();

       const brandNewTicket: Ticket = {
           id: newTicketId,
           subject: newTicketFormData.subject || 'No Subject',
           status: 'New', // Manually created tickets start as New
           priority: 'Medium', // Default priority for manual tickets
           assignedTo: null, // No assignment by default
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

   const handleManualModalClose = () => {
       setIsManualCreationModalOpen(false);
       setNewTicketFormData({ subject: '', channel: '', description: '' }); // Reset form on close
   }

    // --- Sorting Logic (Corrected for potential nulls) ---
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


  // --- Handle Processing with Direct Gemini Call (Moved from page.tsx) ---
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

            console.log('--- Parsed Summary ---');
            console.log(currentSummary);
            console.log('----------------------');
            console.log('--- Parsed Replies ---');
            console.log(currentReplies);
            console.log('----------------------');
             console.log('--- Parsed KB Titles ---');
            console.log(currentKBTitles);
            console.log('------------------------');


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

     // Function to clear compose reply area (Moved from page.tsx)
    const handleClearCompose = () => {
        setComposeReply('');
    };

     // ADDED: Function to handle sending an agent's reply and update conversation
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


    // Function to simulate sending reply (This is now just a simulation alert, not the actual send)
     // Renamed the old handleSendReply to avoid conflict and keep the new one for actual send.
    const handleSimulateSendReplyAlert = () => {
        if (composeReply.trim()) {
            alert(`Simulating sending reply (old method):\n\n${composeReply}`);
            // Don't clear composeReply here if the actual send button clears it
        } else {
             alert('Compose reply is empty.');
        }
    };


    // Function to populate compose reply with a suggestion (Moved from page.tsx)
    const handleSuggestionClick = (suggestion: string) => {
        setComposeReply(suggestion);
    };


  // --- Filtered and Sorted Tickets (Applied per status column) ---
  const filteredTickets = useMemo(() => {
      let filtered = tickets;
      if (filterStatus !== 'All') {
          filtered = filtered.filter(ticket => ticket.status === filterStatus);
      }
      return filtered;
  }, [tickets, filterStatus]);


    // --- Sorting Logic (Corrected for potential nulls) ---
    const sortTicketsManually = (ticketsToSort: Ticket[]) => {
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


  // --- Rendering ---
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
          Ticket Management (Kanban)
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
                      <div className="flex-grow space-y-4 overflow-y-hidden max-h-[calc(100vh-250px)]"> {/* Hide column scrollbar */}
                          {sortTickets(filteredTickets.filter(ticket => ticket.status === status)).map(ticket => (
                              // Ticket Card
                              <div
                                  key={ticket.id}
                                  className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 hover:border-blue-300 cursor-pointer"
                                  onClick={() => handleTicketClick(ticket.id)} // Simulate detail view
                              >
                                  <div className="font-semibold text-gray-800 mb-1 truncate">{ticket.subject}</div>
                                  <div className="text-sm text-gray-600 mb-2">ID: {ticket.id} | Channel: {ticket.channel}</div>
                                  <div className="text-sm text-gray-600 mb-2">Assigned: {ticket.assignedTo || 'Unassigned'}</div>
                                   {/* Priority Indicator */}
                                   <div className={`text-sm ${priorityColors[ticket.priority]} mb-2`}>
                                      Priority: {ticket.priority}
                                   </div>
                                  <div className="text-xs text-gray-500">Last Update: {new Date(ticket.updatedAt).toLocaleString()}</div>

                                  {/* Action Controls (Simulated) */}
                                   <div className="mt-3 flex justify-between items-center text-sm">
                                       {/* Simulate Status Change */}
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
                                       {/* Simulate Assign Change */}
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
                                   {/* TODO: Add Merge, Escalate, Delete/Archive buttons on card or in detail view */}
                              </div>
                          ))}
                           {/* Message if no tickets in this column */}
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

       {/* ADDED: Incoming Call Simulation Popup */}
        {showIncomingCallPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    {callSimulationPhase === 'ringing' && (
                        <>
                            <Phone className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Incoming Call...</h3>
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
                            <p className="text-gray-800">{selectedTicket.assignedTo || 'Unassigned'}</p>
                        </div>
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


                    {/* TODO: Add buttons for actions like Reply, Merge, Escalate, Close, etc. within the modal */}
                     <div className="flex justify-end space-x-4 mt-6">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                              Reply (Simulated)
                          </button>
                           <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                              Close Ticket (Simulated)
                          </button>
                          {/* More action buttons here */}
                     </div>

                </div>
            </div>
        )}
        {/* --- End Detailed Ticket View Modal --- */}


        {/* TODO: Implement other features like Merging, SLA visual indicators, Escalation UI */}


     </div>
  );
}
