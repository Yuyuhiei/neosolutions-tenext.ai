// src/app/tickets/page.tsx

'use client'; // This page uses client-side state and interactions

import React, { useState } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Gemini library
import { hardcodedKnowledgeBase } from '../lib/hardcodedData'; // Import hardcoded KB data
import { Send, Eraser } from 'lucide-react'; // Icons for buttons
import TicketManagementPage from './Kanban'; // Assuming this is your Kanban component

// --- WARNING: SECURITY RISK ---
// Exposing your API key directly in client-side code is NOT secure for production applications.
// For a hackathon MVP, this simplifies setup as requested.
// In a real application, Gemini calls MUST be made from a secure backend (like a Next.js API route).
// Ensure this key is loaded from environment variables in production, NOT hardcoded.
const apiKey = "AIzaSyC1NaNuNzIATe-tlPbO53P7S08_nIT4ZrM"; // Use NEXT_PUBLIC_ prefix for client-side access

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
    // Format each article clearly for the LLM
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
            // Keep the prompt the same, requesting specific headers.
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
4. Format your response clearly with sections for Summary, Suggested Replies, and Relevant KB Articles. Use bold markdown for the headers (**Header:**).

Example Response Format:
**Summary:** ...
**Suggested Replies:**
- Reply 1
- Reply 2
**Relevant KB Articles:**
- KB Title 1
- KB Title 2
(or)
**Relevant KB Articles:** None found.
`;

            console.log('Calling Gemini API with prompt:', prompt);

            const result = await model.generateContent(prompt);
            const response = await result.response;

            if (!response || typeof response.text !== 'function') {
                 console.error('Gemini response object or text() method is undefined.');
                 setProcessingError('Failed to get text response from AI model.');
                 setIsProcessing(false);
                 return;
            }

            const text = response.text();

            console.log('--- Raw Gemini Response Text ---');
            console.log(text);
            console.log('-------------------------------');

            // --- NEW Refactored Parsing (More Robust) ---
            let currentSummary = '';
            let currentReplies: string[] = [];
            let currentKBTitles: string[] = [];

            // Use flexible regex to find the start of each section,
            // allowing for variations in bolding and spacing.
            const summaryHeaderRegex = /\*\*Summary:\*\*/i;
            const repliesHeaderRegex = /\*\*Suggested Replies:\*\*/i;
            const kbHeaderRegex = /\*\*Relevant KB Articles:\*\*/i;

            // Find the index of each header
            const summaryIndex = text.search(summaryHeaderRegex);
            const repliesIndex = text.search(repliesHeaderRegex);
            const kbIndex = text.search(kbHeaderRegex);

            // Extract Summary content
            if (summaryIndex !== -1) {
                // Find the end of the summary section (start of replies or KB, or end of text)
                const summaryContentEndIndex = (repliesIndex !== -1) ? repliesIndex : (kbIndex !== -1) ? kbIndex : text.length;
                currentSummary = text.substring(summaryIndex + text.match(summaryHeaderRegex)![0].length, summaryContentEndIndex).trim();
            } else {
                console.warn('Could not find Summary section header.');
            }

            // Extract Suggested Replies content
            if (repliesIndex !== -1) {
                // Find the end of the replies section (start of KB or end of text)
                const repliesContentEndIndex = (kbIndex !== -1) ? kbIndex : text.length;
                 const rawRepliesText = text.substring(repliesIndex + text.match(repliesHeaderRegex)![0].length, repliesContentEndIndex).trim();

                // Split into lines, clean up bullet points and empty lines
                currentReplies = rawRepliesText.split('\n')
                     .map(line => line.trim())
                     .filter(line => line.length > 0)
                     .map(line => line.replace(/^[*-]?\s*/, '').trim()); // Clean up bullet points (*, -)
             } else {
                 console.warn('Could not find Suggested Replies section header.');
             }

            // Extract Relevant KB Articles content
            if (kbIndex !== -1) {
                 const rawKbText = text.substring(kbIndex + text.match(kbHeaderRegex)![0].length).trim();

                 if (rawKbText.toLowerCase() !== 'none found.' && rawKbText.toLowerCase() !== 'none') {
                    // Split into lines and clean up bullet points/empty lines to get titles
                    currentKBTitles = rawKbText.split('\n')
                         .map(line => line.trim())
                         .filter(line => line.length > 0)
                         .map(line => line.replace(/^[*-]?\s*/, '').trim()); // Clean up bullet points
                 } else {
                      // Gemini explicitly said none found
                     currentKBTitles = ['None found.'];
                 }
             } else {
                 console.warn('Could not find Relevant KB Articles section header.');
                 // If section not found at all, treat as none found
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

            // Add a placeholder KB object if no relevant articles were found or parsed
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

            // Update state with data from Gemini's response
            setSummary(currentSummary);
            setSuggestedReplies(currentReplies);
            setSuggestedKB(relevantKBObjects);

        } catch (error: any) {
            console.error('Error processing concern with Gemini:', error);
            setProcessingError(`Error processing concern: ${error.message || 'Unknown error'}`);
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
            <header className="w-full max-w-full text-center mb-8"> {/* Changed max-w-4xl to max-w-full */}
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


            {/* Main Processing Area - Four Columns */}
            {/* Modified grid classes for 4 columns on medium screens and up */}
            {/* Also removed max-w-4xl here to allow it to take more width if screen is large */}
            <main className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-30">

                {/* First Column: Customer Ticket and Ticket Summary */}
                {/* Use flex-col to stack vertically */}
                <div className="flex flex-col gap-6 w-full">
                    {/* Customer Ticket Input */}
                    {/* flex-grow allows this section to take up available vertical space in this column */}
                    <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Customer Ticket</h2>
                        <textarea
                            className="w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            placeholder="Paste or type customer ticket text here..."
                            value={clientConcern}
                            onChange={(e) => setClientConcern(e.target.value)}
                            disabled={isProcessing} // Disable while processing
                        ></textarea>
                         <div className="flex justify-end mt-4 w-full">
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
                    {/* flex-grow allows this section to take up available vertical space */}
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
                {/* Use flex-col for consistency, but it only contains one item */}
                <div className="flex flex-col gap-6 w-full">
                     {/* Knowledge Base Search/Suggestions Display */}
                     {/* flex-grow allows this section to take up available vertical space */}
                     <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Knowledge Base Suggestions</h2>
                         <div className="w-full p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto max-h-80 flex-grow"> {/* Increased max-h for KB */}
                             {/* Check for the 'KB-None' placeholder to display the correct message */}
                             {suggestedKB.length > 0 && suggestedKB[0].id === 'KB-None' ? (
                                  <p className="text-gray-600 italic">{suggestedKB[0].title}</p>
                             ) : suggestedKB.length > 0 ? (
                                 <ul className="w-full">
                                     {suggestedKB.map(kb => (
                                         <li key={kb.id} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0 w-full">
                                             <p className="font-semibold text-blue-700">{kb.title}</p>
                                              {/* Display snippet or full content */}
                                             <p className="text-sm text-gray-600 italic">{kb.content}</p>
                                              {/* TODO: Add link or button to view full KB article */}
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
                 {/* Use flex-col for consistency, but it only contains one item */}
                <div className="flex flex-col gap-6 w-full">
                    {/* Response Suggestions Display */}
                    {/* flex-grow allows this section to take up available vertical space */}
                    <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Response Suggestions</h2>
                         <div className="w-full h-11/14p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto flex-grow p-3"> {/* Set height to full and flex-grow */}
                             {suggestedReplies.length > 0 ? (
                                 <ul className="list-disc pl-5 w-full">
                                     {suggestedReplies.map((reply, index) => (
                                         // Make these clickable to populate Compose Reply area
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
                 {/* Use flex-col for consistency, but it only contains one item */}
                 <div className="flex flex-col gap-6 w-full">
                 {/* Compose Reply Area */}
                {/* flex-grow allows this section to take up available vertical space */}
                <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">Compose Reply</h2>
                     {/* Set height to full */}
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
                             onClick={handleSendReply}
                              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!composeReply.trim()} // Disable if empty
                         >
                             <Send className="w-4 h-4 mr-1" /> Send Reply
                         </button>
                     </div>
                </section>
                </div> {/* End Fourth Column */}

            </main>

            {/* Include the Kanban board component here */}
            <TicketManagementPage /> 

        </div>
    );
}