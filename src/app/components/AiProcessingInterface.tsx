// src/components/AiProcessingInterface.tsx

'use client'; // This component uses client-side state and interactions

import React, { useState } from 'react';
import { hardcodedKnowledgeBase } from '../lib/hardcodedData';
import { Send, Eraser } from 'lucide-react'; // Icons for buttons

// This component provides the UI and simulated logic for the AI processing interface.
// It takes a client's concern, simulates AI analysis (summary, KB search, reply suggestions),
// and allows the agent to compose and simulate sending a reply.

export default function AiProcessingInterface() {
    // --- State for Input and Simulated AI Outputs ---
    const [clientConcern, setClientConcern] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState('');
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [suggestedKB, setSuggestedKB] = useState<typeof hardcodedKnowledgeBase>([]);
    const [composeReply, setComposeReply] = useState(''); // State for the editable reply area


    // --- Simulated AI Processing Function ---
    const handleProcessTicket = async () => {
        if (!clientConcern.trim()) {
            alert('Please enter client concern text to process.');
            return;
        }

        setIsProcessing(true);
        setSummary(''); // Clear previous results
        setSuggestedReplies([]);
        setSuggestedKB([]);
        // Keep composeReply as is, in case agent was drafting before processing


        // --- Simulate AI Calls (Replace with actual Gemini calls later) ---
        console.log('Simulating AI processing for:', clientConcern);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate Summary Generation (Hardcoded or simple rule-based)
        const simulatedSummary = clientConcern.length > 50
            ? `Summary: Client concern is about ${clientConcern.substring(0, 40).trim()}...`
            : `Summary: ${clientConcern}`;
        setSummary(simulatedSummary);

        // Simulate Suggested Replies (Hardcoded or simple based on keywords)
        let simulatedReplies: string[] = [];
         if (clientConcern.toLowerCase().includes('password') || clientConcern.toLowerCase().includes('log in')) {
             simulatedReplies = [
                 "Please try resetting your password using the 'Forgot Password' link on the login page.",
                 "Could you please clear your browser cache and try logging in again?",
                 "I can help you with account access. What is your username or email?"
             ];
         } else if (clientConcern.toLowerCase().includes('billing') || clientConcern.toLowerCase().includes('invoice')) {
             simulatedReplies = [
                 "I can provide details about your billing cycle. Could you please provide your account number?",
                 "You can view your past invoices in your account dashboard under the billing section.",
             ];
         } else if (clientConcern.toLowerCase().includes('feature request')) {
              simulatedReplies = [
                  "Thank you for your feature request! I will forward this to our product team.",
                  "We appreciate your feedback. Can you provide more details about the feature you need?",
              ];
         }
         else {
              simulatedReplies = ["Thank you for contacting us. How can I assist you further?", "I understand you have a concern. Please provide more details."];
         }
        setSuggestedReplies(simulatedReplies);


        // Simulate Knowledge Base Search (Simple keyword match)
        const keywords = clientConcern.toLowerCase().split(/\W+/).filter(word => word.length > 2);
        const simulatedKBResults = hardcodedKnowledgeBase.filter(article =>
            keywords.some(keyword => article.title.toLowerCase().includes(keyword) || article.content.toLowerCase().includes(keyword))
        );
        setSuggestedKB(simulatedKBResults);


        setIsProcessing(false);
        console.log('Simulated AI processing complete.');

         // TODO: After successful AI processing and potentially creating a ticket (later with backend),
         // you might navigate the agent to the detailed ticket view or the Kanban board.
         // Example: router.push(`/tickets/${newlyCreatedTicketId}`);

    };

     // Function to clear compose reply area
    const handleClearCompose = () => {
        setComposeReply('');
    };

     // Function to simulate sending reply (for UI demo)
    const handleSendReply = () => {
        if (composeReply.trim()) {
            alert(`Simulating sending reply:\n\n${composeReply}`);
            setComposeReply(''); // Clear after simulating send
        } else {
             alert('Compose reply is empty.');
        }
    };

    // Function to populate compose reply with a suggestion
    const handleSuggestionClick = (suggestion: string) => {
        setComposeReply(suggestion);
    };


    // --- Rendering ---
    return (
        // Main processing area layout
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto"> {/* Added mx-auto for centering */}

            {/* Left Column */}
            <div className="flex flex-col gap-6">

                {/* Customer Ticket Input */}
                <section className="bg-white p-6 rounded-lg shadow-md flex-grow">
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">Customer Ticket</h2>
                    <textarea
                        className="w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Paste or type customer ticket text here..."
                        value={clientConcern}
                        onChange={(e) => setClientConcern(e.target.value)}
                        disabled={isProcessing} // Disable while processing
                    ></textarea>
                     <div className="flex justify-end mt-4">
                         <button
                             onClick={handleProcessTicket}
                             className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             disabled={isProcessing || !clientConcern.trim()} // Disable if processing or input is empty
                         >
                             {isProcessing ? 'Processing...' : 'Process Ticket'}
                         </button>
                     </div>
                </section>

                {/* Ticket Summary Display */}
                 <section className="bg-white p-6 rounded-lg shadow-md flex-grow">
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">Ticket Summary</h2>
                     <div className="w-full h-32 p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto"> {/* Uneditable display */}
                         {summary || 'AI-generated summary will appear here after processing the ticket.'}
                     </div>
                </section>

                 {/* Knowledge Base Search/Suggestions Display */}
                 <section className="bg-white p-6 rounded-lg shadow-md flex-grow">
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">Knowledge Base Suggestions</h2>
                     {/* Placeholder for KB Search Input if needed, based on image */}
                     {/* <input type="text" placeholder="Search knowledge base..." className="w-full p-2 border rounded-md mb-3 text-gray-700" /> */}
                     {/* <button className="mb-3 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Search KB</button> */}

                     <div className="w-full p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto max-h-40"> {/* Display area */}
                         {suggestedKB.length > 0 ? (
                             <ul>
                                 {suggestedKB.map(kb => (
                                     <li key={kb.id} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                                         <p className="font-semibold text-blue-700">{kb.title}</p>
                                          <p className="text-sm text-gray-600 italic truncate">{kb.content}</p> {/* Truncate long content */}
                                          {/* TODO: Add link or button to view full KB article */}
                                     </li>
                                 ))}
                             </ul>
                         ) : (
                             'Relevant KB articles will appear here after processing.'
                         )}
                     </div>
                </section>

            </div> {/* End Left Column */}

            {/* Right Column */}
            <div className="flex flex-col gap-6">

                {/* Response Suggestions Display */}
                <section className="bg-white p-6 rounded-lg shadow-md flex-grow">
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">Response Suggestions</h2>
                     <div className="w-full h-32 p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto"> {/* Uneditable display */}
                         {suggestedReplies.length > 0 ? (
                             <ul className="list-disc pl-5">
                                 {suggestedReplies.map((reply, index) => (
                                     // Make these clickable to populate Compose Reply area
                                     <li
                                         key={index}
                                         className="mb-2 cursor-pointer text-blue-700 hover:underline"
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

                 {/* Compose Reply Area */}
                <section className="bg-white p-6 rounded-lg shadow-md flex-grow">
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">Compose Reply</h2>
                     <textarea
                        className="w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Compose your final reply here..."
                        value={composeReply}
                        onChange={(e) => setComposeReply(e.target.value)}
                     ></textarea>
                     <div className="flex justify-end space-x-4 mt-4">
                         <button
                             onClick={handleClearCompose}
                             className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                         >
                             <Eraser className="w-4 h-4 mr-1" /> Clear
                         </button>
                         <button
                             onClick={handleSendReply}
                              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!composeReply.trim()} // Disable if empty
                         >
                             <Send className="w-4 h-4 mr-1" /> Send Reply
                         </button>
                     </div>
                </section>

            </div> {/* End Right Column */}

        </div>
    );
}
