// src/app/tickets/page.tsx

'use client'; // This page uses client-side state and interactions

import React, { useState, useMemo } from 'react';
import { PlusCircle, Filter, ArrowUpDown, XCircle } from 'lucide-react'; // Icons, added XCircle for close button

// --- Hardcoded Data ---
// This simulates data that would eventually come from your Supabase database
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
  // Add other fields like customerId, notes, historyIds etc. later
}

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


  // --- Filtered and Sorted Tickets (Applied per status column) ---
  // We'll filter globally first if needed, then sort within each status group
  const filteredTickets = useMemo(() => {
      let filtered = tickets;
      if (filterStatus !== 'All') {
          filtered = filtered.filter(ticket => ticket.status === filterStatus);
      }
      return filtered;
  }, [tickets, filterStatus]);


  // --- Event Handlers ---
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
    

  // --- Rendering ---
  return (
    // Main container with light blue background theme
    <div className="min-h-screen bg-blue-50 p-8">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">
          Ticket Management (Kanban)
        </h1>
        <p className="text-lg text-gray-700">
          View and manage all customer tickets in a Kanban board.
        </p>
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
      <div className="max-w-7xl mx-auto overflow-x-auto"> {/* Allow horizontal scrolling if columns overflow */}
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


       {/* --- Detailed Ticket View Modal (Simulated) --- */}
       {selectedTicket && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"> {/* Added max-h and overflow */}
                   {/* Modal Header */}
                   <div className="flex justify-between items-center border-b pb-3 mb-4">
                       <h2 className="text-2xl font-bold text-blue-900">Ticket Details: {selectedTicket.id}</h2>
                       <button onClick={handleDetailedViewClose} className="text-gray-500 hover:text-gray-700">
                           <XCircle className="w-6 h-6" />
                       </button>
                   </div>

                   {/* Ticket Details */}
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
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Priority:</p>
                             <span className={`${priorityColors[selectedTicket.priority]}`}>
                                {selectedTicket.priority}
                             </span>
                        </div>
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

                   {/* Description */}
                   <div className="mb-6">
                       <p className="text-sm font-semibold text-gray-600 mb-2">Description:</p>
                       <div className="bg-gray-50 p-3 rounded-md text-gray-800">
                           {selectedTicket.description || 'No description provided.'}
                       </div>
                   </div>

                   {/* Interaction History Placeholder */}
                   <div className="mb-6">
                       <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b pb-2">Interaction History</h3>
                       <div className="text-center text-gray-500 italic">
                           {/* TODO: Implement display of customer interaction history */}
                           <p>Placeholder for interaction history (emails, chats, call logs, notes).</p>
                       </div>
                   </div>

                   {/* Notes Placeholder */}
                   <div className="mb-6">
                       <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b pb-2">Notes</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Public Notes Placeholder */}
                           <div className="bg-gray-50 p-3 rounded-md">
                               <p className="text-sm font-semibold text-gray-600 mb-2">Public Notes:</p>
                               <div className="text-center text-gray-500 italic text-sm">
                                   {/* TODO: Implement Public Notes */}
                                   <p>Placeholder for customer-facing notes.</p>
                               </div>
                           </div>
                           {/* Private Notes Placeholder */}
                            <div className="bg-gray-50 p-3 rounded-md">
                               <p className="text-sm font-semibold text-gray-600 mb-2">Private Notes:</p>
                               <div className="text-center text-gray-500 italic text-sm">
                                   {/* TODO: Implement Private Notes */}
                                   <p>Placeholder for internal notes.</p>
                               </div>
                           </div>
                       </div>
                   </div>

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
