// src/app/page.tsx

import React from 'react';

// This is the main landing page component for your application.
// It provides a brief introduction to the project and serves as the entry point.
// The core agent assist features will be implemented on separate pages/routes later.

export default function Home() {
  return (
    // Use Tailwind classes for styling the main container
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      {/* Main content area, centered and with some padding */}
      <main className="flex w-full max-w-4xl flex-col items-center rounded-lg bg-white p-8 shadow-lg">

        {/* Project Title */}
        <h1 className="mb-4 text-4xl font-bold text-gray-800">
          AI Agent Assist
        </h1>

        {/* Project Description */}
        <p className="mb-8 text-lg text-gray-600 text-center">
          Empowering customer service agents with real-time AI assistance,
          automated summaries, and intelligent insights.
          Built for the CODEBREAK 2.0 Hackathon.
        </p>

        {/* Placeholder for a call to action or link to the main app */}
        {/* Replace this with a Link component from next/link when you create the main app page */}
        <div className="mt-6">
          <a
            href="/agent-dashboard" // Replace with the actual path to your agent dashboard page
            className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition duration-300 ease-in-out hover:bg-blue-700"
          >
            Go to Agent Dashboard (Coming Soon!)
          </a>
        </div>

        {/* You can add more sections here, e.g., features list, team info */}

      </main>
    </div>
  );
}
