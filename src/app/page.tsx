// src/app/page.tsx

'use client'; // This page will use client-side features like state and effects for charts

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
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
import { Ticket, User, MessageSquare, Book, Settings, TrendingUp, PieChart, Bell } from 'lucide-react'; // Added icons for new sections

// Import hardcoded ticket data to derive insights
import { hardcodedTickets } from './lib/hardcodedData';

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
// Using dummy data for the chart for now, but could be generated from hardcodedTickets
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
      color: '#1e3a8a', // Tailwind blue-900
    },
  },
  scales: {
    x: {
      ticks: { color: '#4b5563' }, // Tailwind gray-600
      grid: { color: '#e5e7eb' } // Tailwind gray-200
    },
    y: {
      ticks: { color: '#4b5563' }, // Tailwind gray-600
      grid: { color: '#e5e7eb' } // Tailwind gray-200
    }
  }
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
  // State to hold derived insights from hardcoded data
  const [insights, setInsights] = useState({
    mostFrequentIssues: [] as { issue: string; count: number }[],
    productsWithMostTickets: [] as { product: string; count: number }[],
  });

  // Derive insights from hardcoded tickets on component mount
  useEffect(() => {
    // Calculate most frequent issues
    const issueCounts = hardcodedTickets.reduce((acc, ticket) => {
      acc[ticket.issueSummary] = (acc[ticket.issueSummary] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Get top 5

    // Calculate products with most tickets
    const productCounts = hardcodedTickets.reduce((acc, ticket) => {
      acc[ticket.product] = (acc[ticket.product] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const productsWithMostTickets = Object.entries(productCounts)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Get top 5

    setInsights({ mostFrequentIssues, productsWithMostTickets });
  }, []); // Empty dependency array ensures this runs only once on mount


  return (
    // Main container with light blue background theme and padding
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
          Agent Dashboard
        </h1>
        <p className="text-md md:text-lg text-gray-700">
          Overview of key metrics, AI insights, and quick access to features.
        </p>
      </header>

      {/* Feature Buttons Section */}
      <div className="flex flex-wrap justify-center gap-4 mb-8"> {/* Use gap and flex-wrap for responsiveness */}
        {featureButtons.map((button) => (
          // Use Tailwind for button styling
          <a
            key={button.name}
            href={button.href}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:bg-blue-100 transition duration-300 ease-in-out w-32 text-center" // Fixed width for consistency
          >
            {/* Icon */}
            <button.icon className="w-8 h-8 text-blue-600 mb-2" />
            {/* Button Text */}
            <span className="text-sm font-semibold text-gray-700">{button.name}</span>
          </a>
        ))}
      </div>

      {/* Reporting and Insights Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

        {/* Live Tickets Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
            <Ticket className="w-6 h-6 mr-2 text-blue-600"/> Live Tickets Overview
          </h2>
          <p className="text-4xl font-bold text-gray-800 mb-2">{hardcodedMetrics.liveTickets}</p>
          <p className="text-gray-600">Open: <span className="font-semibold">{hardcodedMetrics.openTickets}</span></p>
          <p className="text-gray-600">Unassigned: <span className="font-semibold">{hardcodedMetrics.unassignedTickets}</span></p>
        </div>

        {/* Performance Metrics Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
             <TrendingUp className="w-6 h-6 mr-2 text-blue-600"/> Performance Metrics
          </h2>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Avg. Response Time Today:</span> {hardcodedMetrics.avgResponseTime}</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">FCR Rate:</span> {hardcodedMetrics.fcrRate}</p>
          <p className="text-gray-700"><span className="font-semibold">CSAT Score:</span> {hardcodedMetrics.csatScore}</p>
        </div>

        {/* Emerging Trends (Derived from Hardcoded Data) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
             <PieChart className="w-6 h-6 mr-2 text-blue-600"/> Emerging Trends
          </h2>
          <p className="text-gray-700 mb-2 font-semibold">Most Frequent Issues:</p>
          {insights.mostFrequentIssues.length > 0 ? (
            <ul className="list-disc list-inside text-gray-600">
              {insights.mostFrequentIssues.map((item, index) => (
                <li key={index}>{item.issue} ({item.count})</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-sm">Analyzing ticket data for trends...</p>
          )}
        </div>

        {/* New vs Closed Tickets Chart Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2 border border-blue-200"> {/* Make this panel wider */}
           <div style={{ height: '300px' }}> {/* Give the chart container a fixed height */}
             <Bar data={hardcodedTicketData} options={chartOptions} />
           </div>
        </div>

        {/* Predictive Insights (Placeholder) */}
         <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 flex flex-col justify-center items-center text-gray-500 italic">
             <h2 className="text-xl font-semibold text-blue-700 mb-4 text-center flex items-center">
                <Bell className="w-6 h-6 mr-2 text-blue-600"/> Predictive Insights
             </h2>
             <p className="text-center">
                <span className="font-semibold not-italic text-blue-900">AI Prediction:</span>
                <br/>Identify customers at risk of churn or needing proactive help.
             </p>
             <p className="text-center text-sm mt-2">(Requires AI/ML model integration)</p>
         </div>

         {/* Customer Behavior Insights (Derived from Hardcoded Data) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
             <User className="w-6 h-6 mr-2 text-blue-600"/> Customer Behavior
          </h2>
          <p className="text-gray-700 mb-2 font-semibold">Products with Most Tickets:</p>
           {insights.productsWithMostTickets.length > 0 ? (
            <ul className="list-disc list-inside text-gray-600">
              {insights.productsWithMostTickets.map((item, index) => (
                <li key={index}>{item.product} ({item.count})</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-sm">Analyzing product data...</p>
          )}
        </div>


      </div>

       {/* Note about UI/UX */}
       <footer className="mt-10 text-center text-gray-600 text-sm">
         <p>General UI/UX Qualities (Consistency, Accessibility, Responsiveness, Error Handling) will be built into the implementation of all components.</p>
       </footer>

    </div>
  );
}
