// src/app/page.tsx

'use client'; // This page will use client-side features like state and effects for charts

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Ticket, User, MessageSquare, Book, Settings } from 'lucide-react'; // Icons for buttons

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Hardcoded data for the charts and metrics (will be replaced with real data later)
const hardcodedTicketData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'New Tickets',
      data: [15, 20, 18, 25, 22, 30, 28],
      backgroundColor: 'rgba(59, 130, 246, 0.6)', // Tailwind blue-500 with opacity
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    },
    {
      label: 'Closed Tickets',
      data: [10, 18, 15, 20, 19, 25, 23],
      backgroundColor: 'rgba(147, 197, 253, 0.6)', // Tailwind blue-300 with opacity
      borderColor: 'rgba(147, 197, 253, 1)',
      borderWidth: 1,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Allow explicit height/width if needed
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'New vs Closed Tickets (Last 7 Days)',
    },
  },
};

const hardcodedMetrics = {
  liveTickets: 45,
  openTickets: 30,
  unassignedTickets: 15,
  avgResponseTime: '9m',
  fcrRate: '85%', // First Contact Resolution Rate
  csatScore: '89%', // Customer Satisfaction Score
};

// Array for the feature buttons
const featureButtons = [
  { name: 'Ticket Management', icon: Ticket, href: '/tickets' }, // TODO: Update hrefs
  { name: 'Customer Info', icon: User, href: '/customers' },
  { name: 'Communication Tools', icon: MessageSquare, href: '/communication' },
  { name: 'Knowledge Management', icon: Book, href: '/knowledge' },
  { name: 'Agent Workflow', icon: Settings, href: '/workflow' },
];


export default function Dashboard() {
  return (
    // Main container with light blue background theme
    <div className="min-h-screen bg-blue-50 p-8">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">
          Agent Dashboard
        </h1>
        <p className="text-lg text-gray-700">
          Overview of key metrics and quick access to features.
        </p>
      </header>

      {/* Feature Buttons Section */}
      <div className="flex justify-center space-x-6 mb-10">
        {featureButtons.map((button) => (
          // Use Tailwind for button styling
          <a
            key={button.name}
            href={button.href}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:bg-blue-100 transition duration-300 ease-in-out"
          >
            {/* Icon */}
            <button.icon className="w-8 h-8 text-blue-600 mb-2" />
            {/* Button Text */}
            <span className="text-sm font-semibold text-gray-700">{button.name}</span>
          </a>
        ))}
      </div>

      {/* Reporting Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

        {/* Live Tickets Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Live Tickets</h2>
          <p className="text-4xl font-bold text-gray-800">{hardcodedMetrics.liveTickets}</p>
          <p className="text-gray-600">Open: {hardcodedMetrics.openTickets}</p>
          <p className="text-gray-600">Unassigned: {hardcodedMetrics.unassignedTickets}</p>
        </div>

        {/* Average Response Time Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Avg. Response Time Today</h2>
          <p className="text-4xl font-bold text-gray-800">{hardcodedMetrics.avgResponseTime}</p>
          <p className="text-gray-600">FCR Rate: {hardcodedMetrics.fcrRate}</p>
        </div>

        {/* CSAT Score Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">CSAT Score</h2>
          <p className="text-4xl font-bold text-gray-800">{hardcodedMetrics.csatScore}</p>
          <p className="text-gray-600">Customer Satisfaction</p>
        </div>

        {/* New vs Closed Tickets Chart Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2"> {/* Make this panel wider */}
           <div style={{ height: '300px' }}> {/* Give the chart container a fixed height */}
             <Bar data={hardcodedTicketData} options={chartOptions} />
           </div>
        </div>

        {/* Placeholder for other reporting panels or features */}
         <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center text-gray-500 italic">
             <h2 className="text-xl font-semibold text-blue-700 mb-4">Other Metrics</h2>
             <p>Placeholder for more charts or data.</p>
             {/* TODO: Add more reporting components here */}
         </div>


      </div>

       {/* Note about UI/UX */}
       <footer className="mt-10 text-center text-gray-600 text-sm">
         <p>General UI/UX Qualities (Consistency, Accessibility, Responsiveness, Error Handling) will be built into the implementation of all components.</p>
       </footer>

    </div>
  );
}
