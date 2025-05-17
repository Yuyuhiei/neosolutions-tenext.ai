// src/app/tickets/page.tsx (This file is now your main page, rendering the Kanban)

'use client'; // This page uses client-side state and interactions

import React from 'react';
import TicketManagementPage from './Kanban'; // Import the Kanban component

export default function TicketsHomePage() {
  return (
    <TicketManagementPage /> // Render the Kanban board as the main page content
  );
}
