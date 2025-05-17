// src/app/customers/page.tsx

'use client'; // This is a Client Component

import React, { useState, useEffect } from 'react';
import { hardcodedTickets } from '../lib/hardcodedData'; // Import hardcoded ticket data

// Define the structure for a customer profile
interface Customer {
  id: string; // Using email as a unique ID for this hardcoded example
  name: string;
  email: string;
  phone: string;
  products: string[]; // List of unique products from their tickets
  notes: string; // Placeholder for customer-specific notes (currently not in hardcoded data)
  tickets: typeof hardcodedTickets; // Array of ticket objects associated with this customer
}

export default function CustomerInfoPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Process hardcoded ticket data to create customer profiles on component mount
  useEffect(() => {
    const customerMap = new Map<string, Customer>();

    hardcodedTickets.forEach(ticket => {
      const customerEmail = ticket.email;

      if (!customerMap.has(customerEmail)) {
        // Create a new customer entry if not already exists
        customerMap.set(customerEmail, {
          id: customerEmail, // Use email as unique ID
          name: ticket.name,
          email: customerEmail,
          phone: ticket.phone,
          products: [], // Initialize products array
          notes: '', // Placeholder for notes
          tickets: [], // Initialize tickets array
        });
      }

      // Get the customer from the map and add the ticket
      const currentCustomer = customerMap.get(customerEmail)!;
      currentCustomer.tickets.push(ticket);

      // Add product if not already in the list
      if (!currentCustomer.products.includes(ticket.product)) {
        currentCustomer.products.push(ticket.product);
      }

      // Note: Aggregating notes from tickets could be done here if needed,
      // but for simplicity, we'll just display ticket notes in the history.
    });

    // Convert the map values to an array of customers
    const customerList = Array.from(customerMap.values());
    setCustomers(customerList);
    setFilteredCustomers(customerList); // Initially display all customers
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle search input changes
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = customers.filter(customer =>
      customer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      customer.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      customer.phone.includes(lowerCaseSearchTerm) ||
      customer.tickets.some(ticket => ticket.ticketId.toLowerCase().includes(lowerCaseSearchTerm)) // Search by ticket ID
    );
    setFilteredCustomers(results);
  }, [searchTerm, customers]); // Re-run filter when searchTerm or customers change

  return (
    // Main container with light blue background theme and padding
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
          Customer Information
        </h1>
        <p className="text-md md:text-lg text-gray-700">
          View and manage customer profiles and history.
        </p>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-md">
        {/* Customer Search Section */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Find Customer</h2>
          <input
            type="text"
            placeholder="Search by Name, Email, Phone, or Ticket ID"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search customer"
          />
        </section>

        {/* Customer List and Detail Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer List (Left Column) */}
          <div className="md:col-span-1 border-r md:pr-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">Customers</h2>
            {filteredCustomers.length === 0 ? (
              <p className="text-gray-500 italic">No customers found.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <li
                    key={customer.id}
                    className={`p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors ${selectedCustomer?.id === customer.id ? 'bg-blue-200 border-blue-500' : ''}`}
                    onClick={() => setSelectedCustomer(customer)}
                    role="button"
                    aria-label={`Select customer ${customer.name}`}
                  >
                    <p className="font-medium text-blue-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Customer Detail (Right Column) */}
          <div className="md:col-span-2">
            {selectedCustomer ? (
              <div>
                <h2 className="text-xl font-semibold text-blue-800 mb-3">Customer Profile</h2>
                <div className="bg-blue-50 p-4 rounded-md shadow-sm mb-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">{selectedCustomer.name}</h3>
                  <p className="text-gray-700 mb-1"><span className="font-semibold">Email:</span> {selectedCustomer.email}</p>
                  <p className="text-gray-700 mb-1"><span className="font-semibold">Phone:</span> {selectedCustomer.phone}</p>
                  <p className="text-gray-700"><span className="font-semibold">Products Used:</span> {selectedCustomer.products.join(', ') || 'N/A'}</p>
                  {/* Placeholder for customer-specific notes */}
                  {/* <p className="text-gray-700 mt-2"><span className="font-semibold">Notes:</span> {selectedCustomer.notes || 'No customer notes.'}</p> */}
                </div>

                {/* Interaction History (Tickets) */}
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Interaction History (Tickets)</h3>
                {selectedCustomer.tickets.length === 0 ? (
                  <p className="text-gray-500 italic">No tickets found for this customer.</p>
                ) : (
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedCustomer.tickets.map(ticket => (
                      <li key={ticket.ticketId} className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
                        <p className="font-medium text-blue-900">Ticket ID: {ticket.ticketId}</p>
                        <p className="text-gray-700 text-sm mb-1"><span className="font-semibold">Submitted:</span> {ticket.dateSubmitted}</p>
                        <p className="text-gray-700 text-sm mb-1"><span className="font-semibold">Product:</span> {ticket.product}</p>
                        <p className="text-gray-800"><span className="font-semibold">Issue:</span> {ticket.issueSummary}</p>
                        {ticket.notes && (
                           <p className="text-gray-600 text-sm italic mt-1"><span className="font-semibold not-italic">Notes:</span> {ticket.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 italic md:mt-20">
                <p>Select a customer from the list to view their profile and history.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
