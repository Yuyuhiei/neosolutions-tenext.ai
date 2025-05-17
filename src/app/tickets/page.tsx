// src/app/tickets/page.tsx

'use client'; // This page uses client-side state and interactions

import React, { useState } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Gemini library
import { hardcodedKnowledgeBase } from '../lib/hardcodedData'; // Import hardcoded KB data
import { Send, Eraser } from 'lucide-react'; // Icons for buttons

// --- WARNING: SECURITY RISK ---
// Exposing your API key directly in client-side code is NOT secure for production applications.
// For a hackathon MVP, this simplifies setup as requested.
// In a real application, Gemini calls MUST be made from a secure backend (like a Next.js API route).
// Ensure this key is loaded from environment variables in production, NOT hardcoded.
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; // Use NEXT_PUBLIC_ prefix for client-side access

if (!apiKey) {
    console.error("NEXT_PUBLIC_GOOGLE_API_KEY environment variable not set. Gemini calls will not work.");
    // You might want to display a user-facing error message if the key is missing
}

// Initialize the Generative Model (only if apiKey is available)
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Using gemini-1.5-flash for potentially faster responses in a hackathon
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;


// Helper function to format KB articles for the prompt
const formatKnowledgeBase = (kb: typeof hardcodedKnowledgeBase) => {
    if (!kb || kb.length === 0) return "No knowledge base articles available.";
    return kb.map(article => `## ${article.title}\n${article.content}`).join('\n\n');
};

// Format the entire hardcoded KB for the prompt
const formattedKB = formatKnowledgeBase(hardcodedKnowledgeBase);


export default function AiProcessingPage() { // Renamed component for clarity on this page
    // --- State for Input and Simulated AI Outputs ---
    const [clientConcern, setClientConcern] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState('');
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    // Use the imported type for suggestedKB, but it will hold filtered results
    const [suggestedKB, setSuggestedKB] = useState<typeof hardcodedKnowledgeBase>([]);
    const [composeReply, setComposeReply] = useState(''); // State for the editable reply area
    const [processingError, setProcessingError] = useState<string | null>(null); // State for errors


    // --- Handle Processing with Direct Gemini Call ---
    const handleProcessTicket = async () => {
        if (!clientConcern.trim()) {
            alert('Please enter client concern text to process.');
            return;
        }
        if (!model) {
             alert('AI model is not configured. Check API key and ensure NEXT_PUBLIC_GOOGLE_API_KEY is set.');
             return;
        }


        setIsProcessing(true);
        setProcessingError(null); // Clear previous errors
        setSummary(''); // Clear previous results
        setSuggestedReplies([]);
        setSuggestedKB([]);
        // Keep composeReply as is, in case agent was drafting before processing

        try {
            // --- Prompt Engineering for Gemini ---
            // We'll use a single prompt to get summary, suggestions, and KB relevance.
            // Instruct Gemini to act as a customer service agent.

            const prompt = `You are an AI-powered customer service assistant. Your task is to analyze a customer's concern, provide a concise summary, suggest empathetic and helpful replies, and identify relevant articles from the provided knowledge base.

Act as a friendly and professional customer service agent in your responses.

Customer Concern:
"${clientConcern}"

Knowledge Base Articles:
${formattedKB}

Instructions:
1. Provide a concise summary of the customer's concern.
2. Suggest 2-3 possible replies that a customer service agent could use. Make them helpful and empathetic.
3. Based on the customer concern, identify which of the provided Knowledge Base Articles are most relevant. List their titles. If no articles seem directly relevant, state that.
4. Format your response clearly with sections for Summary, Suggested Replies, and Relevant KB Articles.

Example Response Format:
Summary: ...
Suggested Replies:
- Reply 1
- Reply 2
Relevant KB Articles:
- KB Title 1
- KB Title 2
(or)
Relevant KB Articles: None found.
`;

            console.log('Calling Gemini API with prompt:', prompt);

            // Call the Gemini API directly from the client component (Hackathon simplification)
            const result = await model.generateContent(prompt);
            const response = await result.response;

            // Check if response and text() are available
            if (!response || typeof response.text !== 'function') {
                 console.error('Gemini response object or text() method is undefined.');
                 setProcessingError('Failed to get text response from AI model.');
                 return; // Exit the function
            }

            const text = response.text();

            console.log('--- Raw Gemini Response Text ---');
            console.log(text);
            console.log('-------------------------------');

            // --- Parse Gemini's Response ---
            // This is a simple parsing based on the requested format.
            // More robust parsing might be needed depending on Gemini's output variations.
            const sections = text.split('\n\n');
            let parsedSummary = '';
            let parsedReplies: string[] = [];
            let parsedKBTitles: string[] = []; // Store just the titles parsed from Gemini

            for (const section of sections) {
                // Use case-insensitive check and allow for variations in header wording
                const lowerSection = section.toLowerCase();
                if (lowerSection.startsWith('summary:')) {
                    parsedSummary = section.substring(section.indexOf(':') + 1).trim();
                } else if (lowerSection.startsWith('suggested replies:') || lowerSection.startsWith('suggested responses:')) { // Allow "Suggested Responses"
                    parsedReplies = section.split('\n')
                        .slice(1)
                        .map(line => line.trim()) // Trim whitespace from the start/end of the line
                        .filter(line => line.length > 0) // Remove empty lines
                        .map(line => line.replace(/^[*-]?\s*/, '').trim()); // Allow hyphens or asterisks as bullet points
                } else if (lowerSection.startsWith('relevant kb articles:') || lowerSection.startsWith('relevant knowledge base articles:')) { // Allow variations
                     const kbLines = section.split('\n')
                         .slice(1)
                         .map(line => line.trim()) // Trim whitespace
                         .filter(line => line.length > 0) // Remove empty lines
                         .map(line => line.replace(/^[*-]?\s*/, '').trim()); // Allow hyphens or asterisks

                     if (kbLines.length > 0 && kbLines[0].toLowerCase() !== 'none found.' && kbLines[0].toLowerCase() !== 'none.') { // Allow "none."
                         parsedKBTitles = kbLines; // Store the titles parsed from Gemini
                     } else {
                         parsedKBTitles = ['None found.']; // Indicate no KB found clearly
                     }
                }
            }

            console.log('--- Parsed Replies ---');
            console.log(parsedReplies);
            console.log('----------------------');
             console.log('--- Parsed KB Titles ---');
            console.log(parsedKBTitles);
            console.log('------------------------');


            // --- Find the full KB objects for the relevant titles ---
            // Add a check to ensure hardcodedKnowledgeBase is defined before calling filter
            const relevantKBObjects = hardcodedKnowledgeBase?.filter(article =>
                 parsedKBTitles.includes(article.title)
            ) || []; // Provide an empty array fallback if hardcodedKnowledgeBase is null/undefined

            // If Gemini explicitly said none found AND we didn't find any matching objects,
            // add a placeholder object for display purposes.
             if (parsedKBTitles.length > 0 && (parsedKBTitles[0].toLowerCase() === 'none found.' || parsedKBTitles[0].toLowerCase() === 'none.') && relevantKBObjects.length === 0) {
                 relevantKBObjects.push({ id: 'KB-None', title: 'No relevant articles found.', content: '' });
             } else if (relevantKBObjects.length === 0 && parsedKBTitles.length > 0 && (parsedKBTitles[0].toLowerCase() !== 'none found.' && parsedKBTitles[0].toLowerCase() !== 'none.')) {
                 // This case means Gemini listed titles, but they didn't match our hardcoded KB.
                 // Log a warning and add a placeholder.
                 console.warn("Gemini suggested KB titles that did not match hardcoded KB:", parsedKBTitles);
                 relevantKBObjects.push({ id: 'KB-None', title: 'Could not find matching articles.', content: 'Gemini suggested titles that did not match our knowledge base.' });
             } else if (relevantKBObjects.length === 0 && parsedKBTitles.length === 0 && text.length > 0) {
                 // This case means Gemini returned text, but none of the expected sections were found.
                 console.warn("Gemini response did not contain expected sections. Raw response:", text);
                  relevantKBObjects.push({ id: 'KB-None', title: 'Could not parse AI response.', content: 'The AI response did not contain the expected sections for suggestions or KB articles.' });
             }


            // Update state with data from Gemini's response
            setSummary(parsedSummary);
            setSuggestedReplies(parsedReplies);
            setSuggestedKB(relevantKBObjects); // Update state with the filtered/placeholder objects

        } catch (error: any) { // Use 'any' or a more specific error type if preferred
            console.error('Error processing concern with Gemini:', error);
            setProcessingError(`Error processing concern: ${error.message || 'Unknown error'}`);
            // Optionally clear results if an error occurs
            setSummary('');
            setSuggestedReplies([]);
            setSuggestedKB([]);

        } finally {
            setIsProcessing(false);
        }
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
        // Main container with light blue background theme, centered content
        <div className="min-h-screen bg-blue-50 p-8 flex flex-col items-center">
            <header className="w-full max-w-4xl text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">AI-Powered Customer Support Assistant</h1>
                 <p className="text-gray-700">Process client concerns and get AI assistance.</p>
            </header>

            {/* Link to Kanban Board (if you create it later at /kanban) */}
             {/* Update this link if you move the Kanban board */}
             {/*
             <div className="w-full max-w-4xl text-right mb-4">
                <Link href="/kanban" className="text-blue-600 hover:underline">
                   View All Tickets (Kanban Board) →
                 </Link>
             </div>
             */}


            {/* Main Processing Area - Two Columns */}
            <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">

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
                         <div className="w-full h-32 p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto whitespace-pre-wrap"> {/* Uneditable display, added whitespace-pre-wrap */}
                              {processingError ? (
                                  <p className="text-red-600">{processingError}</p>
                              ) : (
                                  summary || 'AI-generated summary will appear here after processing the ticket.'
                              )}
                         </div>
                    </section>

                     {/* Knowledge Base Search/Suggestions Display */}
                     <section className="bg-white p-6 rounded-lg shadow-md flex-grow">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Knowledge Base Suggestions</h2>
                         {/* Placeholder for KB Search Input if needed, based on image */}
                         {/* <input type="text" placeholder="Search knowledge base..." className="w-full p-2 border rounded-md mb-3 text-gray-700" /> */}
                         {/* <button className="mb-3 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Search KB</button> */}

                         <div className="w-full p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto max-h-40"> {/* Display area */}
                             {suggestedKB.length > 0 && suggestedKB[0].id !== 'KB-None' ? (
                                 <ul>
                                     {suggestedKB.map(kb => (
                                         <li key={kb.id} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                                             <p className="font-semibold text-blue-700">{kb.title}</p>
                                              {/* Display snippet or full content */}
                                             <p className="text-sm text-gray-600 italic">{kb.content}</p>
                                              {/* TODO: Add link or button to view full KB article */}
                                         </li>
                                     ))}
                                 </ul>
                             ) : suggestedKB.length > 0 && suggestedKB[0].id === 'KB-None' ? (
                                 <p className="text-gray-600 italic">No relevant articles found.</p>
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

            </main>

        </div>
    );
}
