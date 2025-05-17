// src/app/tickets/page.tsx

'use client'; // This page uses client-side state and interactions

import React, { useState, useEffect, useRef } from 'react'; // Import useEffect and useRef
import Link from 'next/link'; // Import Link for navigation
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Gemini library
import { hardcodedKnowledgeBase } from '../lib/hardcodedData'; // Import hardcoded KB data
// Import icons: Send, Eraser, and Mic for STT
import { Send, Eraser, Mic } from 'lucide-react';
// Assuming TicketManagementPage is still relevant below the main area
import TicketManagementPage from './Kanban';


// --- WARNING: SECURITY RISK ---
// Exposing your API key directly in client-side code is NOT secure for production applications.
// For a hackathon MVP, this simplifies setup as requested.
// In a real application, Gemini calls MUST be made from a secure backend (like a Next.js API route).
// Ensure this key is loaded from environment variables in production, NOT hardcoded.
const apiKey = "AIzaSyC1NaNuNzIATe-tlPbO53P7S08_nIT4ZrM";

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


// Declare SpeechRecognition globally to avoid TypeScript errors
// as it's not standard in all browser typescripts.
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}


export default function AiProcessingPage() { // Renamed component for clarity on this page
    // --- Existing State for Input and Simulated AI Outputs ---
    const [clientConcern, setClientConcern] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState('');
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [suggestedKB, setSuggestedKB] = useState<typeof hardcodedKnowledgeBase>([]);
    const [composeReply, setComposeReply] = useState('');
    const [processingError, setProcessingError] = useState<string | null>(null);

    // --- State for Actual Speech-to-Text ---
    const [isRecording, setIsRecording] = useState(false);
    const [sttError, setSttError] = useState<string | null>(null);
    const [interimTranscript, setInterimTranscript] = useState(''); // State to hold interim results
    // --- ADDED STATE: Track if STT API is initialized ---
    const [isSTTReady, setIsSTTReady] = useState(false);


    // Use useRef to hold the SpeechRecognition instance
    const recognitionRef = useRef<any | null>(null);


    // --- Effect to Initialize SpeechRecognition ---
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setSttError("Speech recognition not supported in this browser.");
            console.error("Speech Recognition API not supported.");
            // --- Set STT ready state even if not supported ---
            setIsSTTReady(true); // Mark as ready (or not supported)
            return;
        }

        try {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Set to true for continuous recognition until stopped
            recognitionRef.current.interimResults = true; // Set to true to get interim results as user speaks
            recognitionRef.current.lang = 'en-US'; // Set the language

            // --- Event Handlers ---
            recognitionRef.current.onstart = () => {
                console.log('Speech recognition started.');
                setIsRecording(true);
                setSttError(null);
                setInterimTranscript('');
                // Do NOT clear clientConcern here, let it accumulate
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
                    // Add a space before appending if clientConcern is not empty
                    setClientConcern(prevConcern => prevConcern + (prevConcern.trim() ? ' ' : '') + finalTranscript.trim());
                    // Clear interim transcript once a final result is processed for this segment
                    setInterimTranscript('');
                }

                // Always update interim transcript state for display
                setInterimTranscript(currentInterimTranscript);

                 // Optional: Automatically scroll the textarea to the bottom
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
                          // In continuous mode, no-speech in a segment doesn't stop recognition.
                          // You might choose to ignore this error or provide subtle feedback.
                           return; // Don't set error state or stop recording for 'no-speech' in continuous mode
                      case 'audio-capture':
                           errorMessage = "Could not start audio capture. Ensure microphone is available.";
                           setIsRecording(false); // Stop recording state on this critical error
                           break;
                     default:
                         errorMessage += ` (Error: ${event.error})`;
                         setIsRecording(false); // Stop recording state on other errors
                 }
                 setSttError(errorMessage);
            };

            recognitionRef.current.onend = () => {
                console.log('Speech recognition ended.');
                // This will be called when recognition.stop() is explicitly called, or on critical errors.
                setIsRecording(false);
                setInterimTranscript(''); // Clear any leftover interim transcript
            };

            // --- Set STT ready state after successful initialization ---
             setIsSTTReady(true);

        } catch (error: any) {
             console.error("Error initializing Speech Recognition:", error);
             setSttError(`Error initializing Speech Recognition: ${error.message || 'Unknown error'}`);
             // --- Set STT ready state even if initialization failed ---
             setIsSTTReady(true);
        }


        // Clean up the recognition instance when the component unmounts
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop(); // Explicitly stop any ongoing recognition
                recognitionRef.current = null;
            }
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount


    // --- Manual Processing Handler (Existing Logic) ---
    const handleProcessTicket = async () => {
        // Use the combined text for processing
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

    // --- Handler to Start/Stop Speech-to-Text ---
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
            recognitionRef.current.start();
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
            <header className="w-full max-w-full text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">AI-Powered Customer Support Assistant</h1>
                 <p className="text-gray-700">Process client concerns and get AI assistance.</p>
                 {/* Display STT errors */}
                 {sttError && (
                      <p className="text-red-600 mt-2">{sttError}</p>
                 )}
            </header>

            {/* Main Processing Area - Four Columns */}
            <main className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-30">

                {/* First Column: Customer Ticket and Ticket Summary */}
                <div className="flex flex-col gap-6 w-full">
                    {/* Customer Ticket Input/Real-time Transcript */}
                    <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                         <h2 className="text-xl font-semibold text-blue-700 mb-4">Customer Ticket</h2>
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
                         <div className="flex justify-between items-center mt-4 w-full"> {/* Adjusted layout */}
                              {/* Speech-to-Text Button */}
                             <button
                                  onClick={handleToggleSpeechToText}
                                  className={`flex items-center text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                                  // --- MODIFIED DISABLED CONDITION ---
                                  // Disable if processing or STT not ready/supported.
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
                                 // --- MODIFIED DISABLED CONDITION ---
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
                <div className="flex flex-col gap-6 w-full">
                     <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Knowledge Base Suggestions</h2>
                         <div className="w-full p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto h-12/14 flex-grow"> {/* Changed max-h to h-full and added flex-grow */}
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
                <div className="flex flex-col gap-6 w-full">
                    <section className="bg-white p-6 rounded-lg shadow-md flex-grow w-full">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Response Suggestions</h2>
                         <div className="w-full h-12/14 p-3 border rounded-md bg-gray-50 text-gray-700 overflow-y-auto flex-grow"> {/* Set height to full and flex-grow */}
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
                 <div className="flex flex-col gap-6 w-full">
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