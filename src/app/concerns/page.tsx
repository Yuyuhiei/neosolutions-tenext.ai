"use client";

/**
 * @module LowLevelConcerns
 * @description This component implements a swipeable, TikTok-like interface for reviewing
 * low-level customer concerns (simulated tickets) and selecting AI-generated responses.
 * It demonstrates a potential pattern for quickly triaging and responding to common issues.
 */

import React, { useState, useEffect } from 'react';
// Import React hooks: useState for state management, useEffect for side effects.

// --- TypeScript Types ---
/**
 * @interface Ticket
 * @description Defines the structure of a simulated low-level customer ticket.
 * @property {string} id - Unique identifier for the ticket.
 * @property {string} customer_name - The name of the customer.
 * @property {string} issue_summary - A brief summary of the customer's issue.
 * @property {number} tier - The perceived urgency or complexity tier (e.g., 0 for positive, 1 for common issues).
 * @property {string} sentiment - The overall sentiment expressed by the customer (e.g., "frustrated", "concerned", "positive").
 * @property {string} emotion - Specific emotions or states described (e.g., "urgent, annoyed", "anxious").
 */
interface Ticket {
  id: string;
  customer_name: string;
  issue_summary: string;
  tier: number;
  sentiment: string;
  emotion: string;
}

/**
 * @interface AIResponse
 * @description Defines the structure of a suggested AI-generated response.
 * @property {string} tone - The suggested tone of the response (e.g., "empathetic", "efficient", "friendly").
 * @property {string} text - The suggested response text.
 */
interface AIResponse {
  tone: string;
  text: string;
}

/**
 * @interface SelectedResponse
 * @extends AIResponse
 * @description Defines the structure for a response that has been selected by the user,
 * including the ID of the ticket it was chosen for.
 * @property {string} ticketId - The ID of the ticket for which the response was selected.
 */
interface SelectedResponse extends AIResponse {
  ticketId: string;
}

// --- Hardcoded Ticket Data ---
/**
 * @constant {Ticket[]} initialTickets
 * @description An array of hardcoded objects simulating initial low-level customer tickets
 * for the swipeable interface.
 */
const initialTickets: Ticket[] = [
  {
    "id": "ticket001",
    "customer_name": "Jamie",
    "issue_summary": "I can’t log into my account after resetting my password. I’ve tried three times now and still get an error. Please help — this is really frustrating.",
    "tier": 1,
    "sentiment": "frustrated",
    "emotion": "urgent, annoyed"
  },
  {
    "id": "ticket002",
    "customer_name": "Alex",
    "issue_summary": "My recent order (ID: #XYZ123) hasn't arrived, and the tracking information hasn't updated in 3 days. Can you check on this for me?",
    "tier": 1,
    "sentiment": "concerned",
    "emotion": "anxious"
  },
  {
    "id": "ticket003",
    "customer_name": "Sam",
    "issue_summary": "I'm trying to integrate your API into my new project, but I'm getting a persistent authentication error (401). I've double-checked my API key. The documentation for endpoint X seems a bit unclear on the auth header format.",
    "tier": 2,
    "sentiment": "confused",
    "emotion": "seeking_clarification"
  },
  {
    "id": "ticket004",
    "customer_name": "Casey",
    "issue_summary": "Just wanted to say your new feature for custom dashboards is amazing! It's made my workflow so much smoother. Great job!",
    "tier": 0,
    "sentiment": "positive",
    "emotion": "happy, appreciative"
  },
  {
    "id": "ticket005",
    "customer_name": "Jamie",
    "issue_summary": "I'm still unable to log in after the password reset. I've followed all instructions carefully. Could there be a system-side issue?",
    "tier": 1,
    "sentiment": "calm",
    "emotion": "persistent, inquisitive"
  },
  {
    "id": "ticket006",
    "customer_name": "Jamie",
    "issue_summary": "Hi, I reset my password but login isn't working. I'm a bit lost on what to try next. Are there simple steps for this kind of error?",
    "tier": 1,
    "sentiment": "confused",
    "emotion": "seeking_guidance"
  },
  {
    "id": "ticket007",
    "customer_name": "Jamie",
    "issue_summary": "Password reset done, but login fails. Suspecting it might be a token validation or session propagation delay on your end. Can you check logs for user 'Jamie'?",
    "tier": 2,
    "sentiment": "analytical",
    "emotion": "technical, specific"
  },
  {
    "id": "ticket008",
    "customer_name": "Jamie",
    "issue_summary": "So sorry to bother, but I reset my password and can't log in. I'm worried I might have done something wrong during the process. Any help appreciated!",
    "tier": 1,
    "sentiment": "apologetic",
    "emotion": "hesitant, concerned_self"
  },
  {
    "id": "ticket009",
    "customer_name": "Jamie",
    "issue_summary": "I've tried resetting my password and also cleared my cache as often suggested, but I'm still locked out. Feeling a bit stuck but hopeful you can assist!",
    "tier": 1,
    "sentiment": "hopeful",
    "emotion": "stuck_but_optimistic"
  }
];

// --- Styles ---
/**
 * @constant {string} globalStyles
 * @description A string containing CSS styles for the component.
 * These styles are injected into the document head and are crucial for
 * the layout and the TikTok-like card transition animations.
 */
const globalStyles = `
  body {
    font-family: 'Roboto', 'Inter', sans-serif;
    overscroll-behavior-y: contain;
    margin: 0;
    /* Changed background to white */
    background-color: var(--color-blue-50);
    /* Changed default text color to black for visibility on white background */
    color: black;
  }
  #root, body, html { /* Ensure full height for centering */
    height: 100%;
  }
  .ticket-card-container {
    height: 100vh;
    width: 100vw;
    max-width: 100%;
    overflow: hidden;
    position: relative;
    /* Added flex properties to center content */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ticket-card-wrapper { /* New wrapper for individual card positioning and animation */
    position: absolute; /* Keep absolute for stacking/animation */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease-out;
     /* Added flex properties to center content within the wrapper */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px; /* Add some padding */
    box-sizing: border-box; /* Include padding in width/height */
  }
  .ticket-card-wrapper.active {
    transform: translateY(0%);
    opacity: 1;
    z-index: 10;
  }
  .ticket-card-wrapper.prev {
    transform: translateY(-100%);
    opacity: 0;
    z-index: 5;
  }
  .ticket-card-wrapper.next { /* For pre-rendering next card if needed, not used in current simple stack */
    transform: translateY(100%);
    opacity: 0;
    z-index: 5;
  }
  .ticket-content-wrapper-react { /* Renamed to avoid conflict if old html is around */
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem; /* 24px */
    width: 95%; /* Adjust width as needed */
    max-width: 500px; /* Max width for the card */
    margin-bottom: 1rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1); /* Lighter shadow */
    color: black; /* Ensure text inside card is black */
  }
  .response-buttons-react {
    width: 95%; /* Match card width */
    max-width: 500px; /* Match card max width */
  }
  .response-buttons-react button { /* Renamed */
    transition: background-color 0.2s ease, transform 0.1s ease;
    border-radius: 8px;
    font-weight: 500;
    background-color: rgba(0, 0, 0, 0.05); /* Slightly visible on white */
    color: black; /* Button text color */
    border: 1px solid rgba(0,0,0,0.1); /* Add a subtle border */
  }
  .response-buttons-react button:hover {
    background-color: rgba(0, 0, 0, 0.1); /* Darker on hover */
    transform: scale(1.02);
  }
  .tag-react { /* Renamed */
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
    color: white; /* Keep tag text white for visibility on colored background */
  }
  /* Custom scrollbar for ticket content if it overflows */
  .ticket-content-scroll::-webkit-scrollbar { width: 6px; }
  .ticket-content-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 3px; } /* Adjusted for white background */
  .ticket-content-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; } /* Adjusted for white background */
  .ticket-content-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); } /* Adjusted for white background */

  /* Styling for the "All tickets processed" message */
  .all-processed-message {
    text-align: center;
    padding: 2.5rem; /* 40px */
    background-color: rgba(0,0,0,0.1); /* Slightly visible on white */
    border-radius: 12px;
    color: black; /* Ensure text is black */
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }
`;

// --- Mock API Call ---
/**
 * @function fetchAIResponses
 * @description A mock asynchronous function that simulates calling an AI API
 * to get suggested responses for a given ticket.
 * @param {Ticket} ticketDetails - The ticket object for which to fetch responses.
 * @returns {Promise<{ responses: AIResponse[] }>} A promise resolving to an object containing an array of AIResponse suggestions.
 * @async
 */
async function fetchAIResponses(ticketDetails: Ticket): Promise<{ responses: AIResponse[] }> {
  console.log("Fetching AI responses for:", ticketDetails.customer_name, ticketDetails.issue_summary);
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay

  const baseResponses = [
    { "tone": "empathetic", "text": `Sorry to hear about the issue, ${ticketDetails.customer_name}. Let's try to resolve this. Could you try clearing your browser cache and cookies first?` },
    { "tone": "efficient", "text": `${ticketDetails.customer_name}, please attempt to reproduce the error in an incognito window. This will help rule out extension conflicts.` },
    { "tone": "friendly", "text": `Hey ${ticketDetails.customer_name}! No worries, we'll get this sorted. Sometimes a simple device restart can do wonders. Worth a shot!` }
  ];

  if (ticketDetails.tier > 0 || ticketDetails.sentiment === "frustrated" || ticketDetails.sentiment === "angry") {
    baseResponses.push({ "tone": "direct", "text": `For a Tier ${ticketDetails.tier} issue like this, ${ticketDetails.customer_name}, I can escalate this to our specialist team if basic steps don't work.` });
  }
  if (ticketDetails.sentiment === "positive") {
    return {
      responses: [
        { "tone": "appreciative", "text": `That's great to hear, ${ticketDetails.customer_name}! We're thrilled you like it.` },
        { "tone": "engaging", "text": `Awesome, ${ticketDetails.customer_name}! Any specific part you found most helpful? We love feedback!` }
      ]
    };
  }
  // Return 3 to 5 responses
  return { responses: baseResponses.slice(0, Math.floor(Math.random() * 3) + 3) };
}


// --- Components ---
/**
 * @interface TicketCardProps
 * @description Props for the TicketCard component.
 * @property {Ticket} ticket - The ticket object to display.
 * @property {(response: AIResponse) => void} onResponseSelect - Callback function when a response is selected.
 * @property {boolean} isExiting - Boolean indicating if the card should play its exit animation.
 */
interface TicketCardProps {
  ticket: Ticket;
  onResponseSelect: (response: AIResponse) => void;
  isExiting: boolean;
}

/**
 * @function TicketCard
 * @description A functional React component that renders a single ticket card with AI-suggested responses.
 * It includes loading states for responses and handles the card's entry/exit animations based on `isExiting`.
 * @param {TicketCardProps} props - The component's props.
 * @returns {React.ReactElement} The JSX element for the ticket card.
 */
const TicketCard: React.FC<TicketCardProps> = ({ ticket, onResponseSelect, isExiting }) => {
  /**
   * @constant {AIResponse[]} aiResponses
   * @description State variable holding the AI-generated response suggestions for the current ticket.
   */
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);

  /**
   * @constant {boolean} isLoadingResponses
   * @description State variable indicating whether AI responses are currently being fetched.
   */
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);

  /**
   * @constant {string} animationClass
   * @description State variable controlling the CSS class for the card's entry/exit animation ('', 'active', 'prev').
   */
  const [animationClass, setAnimationClass] = useState(''); // For entry animation

  /**
   * @effect
   * @description Fetches AI responses for the current `ticket` and controls the card's
   * animation class based on `isExiting`. Runs when `ticket` or `isExiting` change.
   */
  useEffect(() => {
    // Fetch responses when ticket changes
    setIsLoadingResponses(true);
    setAiResponses([]); // Clear old responses
    fetchAIResponses(ticket).then(data => {
      setAiResponses(data.responses);
      setIsLoadingResponses(false);
    });

    // Entry animation: If not exiting, apply 'active' after a brief delay to allow transition
    // This assumes the card starts off-screen or invisible by default if not 'prev'
    if (!isExiting) {
      setAnimationClass(''); // Start with base class (could be styled to be off-screen)
      requestAnimationFrame(() => { // Ensure it's in the next frame
        setAnimationClass('active');
      });
    } else {
      setAnimationClass('prev');
    }
  }, [ticket, isExiting]);

  // If isExiting is true, animationClass is 'prev'. If false, it becomes 'active'.
  const cardClassName = `ticket-card-wrapper ${animationClass}`;

  return (
    // The wrapper itself is now centered via flexbox in globalStyles
    <div className={cardClassName} >
      {/* Content inside the wrapper is also centered via flexbox on the wrapper*/}
      <div className="flex flex-col justify-center items-center w-full h-full p-5 box-border">
        <div className="ticket-content-wrapper-react">
          <div className="ticket-content-scroll flex-grow overflow-y-auto mb-4 max-h-[60vh]">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">{ticket.customer_name}</h2>
            <p className="text-sm sm:text-base mb-4 leading-relaxed">{ticket.issue_summary}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="tag-react bg-blue-500 text-white">Tier {ticket.tier}</span>
              <span className="tag-react bg-yellow-500 text-white">{ticket.sentiment}</span>
              <span className="tag-react bg-purple-500 text-white">{ticket.emotion}</span>
            </div>
          </div>
        </div>

        <div className="response-buttons-react w-full space-y-3">
          {isLoadingResponses ? (
            <p className="text-center py-2">Loading responses...</p>
          ) : (
            aiResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => onResponseSelect(response)}
                className="w-full text-black font-semibold py-3 px-4 text-sm text-left" // Changed text to black
              >
                <span className="font-bold capitalize">{response.tone}:</span> {response.text}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * @function App
 * @description The main functional component for the Low-Level Concerns page.
 * It manages the state of the ticket queue, the currently displayed ticket,
 * selected responses, and the card transition animations. It injects global styles
 * and loads/saves selected responses to local storage.
 * @returns {React.ReactElement} The JSX element for the Low-Level Concerns interface.
 */
const App: React.FC = () => {
  /**
   * @constant {Ticket[]} tickets
   * @description State variable holding the array of all low-level tickets to be processed.
   * Initialized with `initialTickets`.
   */
  const [tickets] = useState<Ticket[]>(initialTickets);

  /**
   * @constant {number} currentTicketIndex
   * @description State variable holding the index of the ticket currently being displayed.
   * -1 indicates that all tickets have been processed.
   */
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  /**
   * @constant {SelectedResponse[]} selectedResponses
   * @description State variable holding the array of responses selected by the user for each ticket.
   * Stored and loaded from local storage.
   */
  const [selectedResponses, setSelectedResponses] = useState<SelectedResponse[]>([]);

  /**
   * @constant {boolean} isTransitioning
   * @description State variable indicating whether a card transition animation is currently in progress.
   */
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * @constant {number} renderKey
   * @description State variable used as a key to force re-rendering (and thus re-animation)
   * of the active `TicketCard` component when the ticket changes or when starting over.
   */
  const [renderKey, setRenderKey] = useState(0); // Used to force re-render of the active card

  // Inject global styles
  /**
   * @effect
   * @description Injects the `globalStyles` CSS and the Google Fonts link into the document head
   * when the component mounts. Cleans up the injected elements when the component unmounts.
   */
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = globalStyles;
    document.head.appendChild(styleElement);
    // Add Google Fonts link
    const fontLink = document.createElement('link');
    fontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Inter:wght@400;500;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    return () => {
      document.head.removeChild(styleElement);
      document.head.removeChild(fontLink);
    };
  }, []);

  // Load selected responses from localStorage on mount
  /**
   * @effect
   * @description Attempts to load previously selected responses from the browser's
   * local storage when the component mounts and updates the `selectedResponses` state.
   */
    useEffect(() => {
    const storedResponses = localStorage.getItem('selectedUserResponsesReact');
    if (storedResponses) {
      setSelectedResponses(JSON.parse(storedResponses));
    }
  }, []);

  /**
   * @function handleResponseSelect
   * @description Handles the event when a user selects an AI-suggested response for the current ticket.
   * - Adds the selected response and ticket ID to the `selectedResponses` state.
   * - Saves the updated `selectedResponses` to local storage.
   * - Triggers the exit animation for the current card by setting `isTransitioning` to true.
   * - After the animation duration, updates the `currentTicketIndex` to move to the next ticket or indicate completion.
   * @param {AIResponse} response - The AI response object that was selected.
   */
  const handleResponseSelect = (response: AIResponse) => {
    if (isTransitioning) return;

    const currentTicket = tickets[currentTicketIndex];
    const newSelectedResponse: SelectedResponse = {
      ...response,
      ticketId: currentTicket.id,
    };
    const updatedSelectedResponses = [...selectedResponses, newSelectedResponse];
    setSelectedResponses(updatedSelectedResponses);
    localStorage.setItem('selectedUserResponsesReact', JSON.stringify(updatedSelectedResponses));

    setIsTransitioning(true); // Start exit animation for current card

    setTimeout(() => {
      if (currentTicketIndex < tickets.length - 1) {
        setCurrentTicketIndex(prevIndex => prevIndex + 1);
      } else {
        // All tickets processed
        setCurrentTicketIndex(-1); // Indicate end
      }
      setIsTransitioning(false); // New card is now active, transition is complete for the logic
    }, 400); // Match CSS transition duration
  };

  const currentTicket = tickets[currentTicketIndex];

  if (currentTicketIndex === -1) { // All tickets processed
    return (
      // Centered via the ticket-card-container flex styles
      <div className="ticket-card-container">
        <div className="all-processed-message"> {/* Applied new class */}
          <h2 className="text-2xl font-bold mb-4">All tickets processed!</h2>
          <p>Great job!</p>
          <button
            onClick={() => {
                setCurrentTicketIndex(0);
                setSelectedResponses([]);
                localStorage.removeItem('selectedUserResponsesReact');
                setRenderKey(prev => prev + 1); // Force re-render of first card
            }}
            className="mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Simplified rendering: Always render one TicketCard.
  // Its 'key' prop (currentTicket.id + renderKey) ensures it re-mounts/re-animates when the ticket changes or when starting over.
  // 'isExiting' prop controls whether it's animating out ('prev' class) or in ('active' class).
  return (
    // ticket-card-container handles the centering for all its children
    <div className="ticket-card-container">
      {currentTicket ? (
        <TicketCard
            key={currentTicket.id + `-${renderKey}`} // Add renderKey to ensure re-mount on "Start Over" for the same first ticket
            ticket={currentTicket}
            onResponseSelect={handleResponseSelect}
            isExiting={isTransitioning}
        />
      ) : (
        // Should not happen if currentTicketIndex is managed correctly
        // Also centered via ticket-card-container
        <div className="ticket-card-container">
            <p>No current ticket.</p>
        </div>
      )}
    </div>
  );
};

export default App;