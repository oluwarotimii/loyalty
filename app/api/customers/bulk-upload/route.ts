import { NextRequest, NextResponse } from 'next/server';
import { createCustomer, getTiers, getCustomerById } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  total_spending: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the form data to get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    if (!fileType.includes('csv') && !fileName.endsWith('.csv') && 
        !fileType.includes('excel') && !fileName.endsWith('.xlsx') && 
        !fileName.endsWith('.xls')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a CSV or Excel file.' 
      }, { status: 400 });
    }

    // Convert File object to ArrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse the file based on its type
    let customerData: CustomerData[] = [];
    
    if (fileType.includes('csv') || fileName.endsWith('.csv')) {
      customerData = await parseCsvFile(buffer);
    } else {
      customerData = await parseExcelFile(buffer);
    }

    // Validate parsed data
    const validationErrors = validateCustomerData(customerData);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }

    // Get available tiers to assign customers appropriately
    const tiers = await getTiers();
    
    // Process each customer and add to the database
    const results = [];
    for (const customer of customerData) {
      try {
        // Check if customer already exists by email
        let existingCustomer = null;
        try {
          const { sql } = await import('@vercel/postgres');
          const result = await sql`SELECT * FROM customers WHERE email = ${customer.email}`;
          if (result.rows.length > 0) {
            existingCustomer = result.rows[0];
          }
        } catch (error) {
          console.log(`Error checking for existing customer with email ${customer.email}:`, error);
        }
        
        let customerRecord;
        if (existingCustomer) {
          // Update existing customer if needed
          customerRecord = existingCustomer;
        } else {
          // Create new customer
          customerRecord = await createCustomer(
            customer.name, 
            customer.email, 
            customer.phone || ''
          );
        }
        
        // Create a transaction for the total spending to trigger tier assignment
        if (customer.total_spending > 0) {
          await createTransactionForCustomer(
            customerRecord.id, 
            customer.total_spending, 
            'Initial spend from bulk upload'
          );
        }
        
        // Get updated customer info with total spending
        const updatedCustomer = await getCustomerById(customerRecord.id);
        
        // Determine the appropriate tier based on spending
        const assignedTier = determineTierFromSpending(updatedCustomer.total_spending, tiers);
        
        results.push({
          ...updatedCustomer,
          assigned_tier: assignedTier?.name || 'Unassigned',
          status: 'success'
        });
      } catch (error: any) {
        results.push({
          name: customer.name,
          email: customer.email,
          status: 'error',
          error: error.message || 'Failed to create/update customer'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      processed_count: results.length,
      success_count: results.filter(r => r.status === 'success').length,
      error_count: results.filter(r => r.status === 'error').length
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process file upload', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function parseCsvFile(buffer: Buffer): Promise<CustomerData[]> {
  return new Promise((resolve, reject) => {
    const csvString = buffer.toString('utf-8');
    
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => {
        // Trim whitespace and handle empty strings
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }
        
        // Map the parsed data to our expected format
        const mappedData: CustomerData[] = results.data.map((row: any) => ({
          name: row.name || row.Name || row.full_name || row['Full Name'] || '',
          email: row.email || row.Email || row.email_address || row['Email Address'] || '',
          phone: row.phone || row.Phone || row.phone_number || row['Phone Number'],
          total_spending: parseFloat(row.total_spending || row.TotalSpending || row['Total Spending'] || row.amount || row.Amount || '0') || 0
        }));
        
        resolve(mappedData);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

async function parseExcelFile(buffer: Buffer): Promise<CustomerData[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get the first worksheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  // Map the data to our expected format
  const mappedData: CustomerData[] = jsonData.map((row: any) => ({
    name: row.name || row.Name || row.full_name || row['Full Name'] || '',
    email: row.email || row.Email || row.email_address || row['Email Address'] || '',
    phone: row.phone || row.Phone || row.phone_number || row['Phone Number'],
    total_spending: parseFloat(row.total_spending || row.TotalSpending || row['Total Spending'] || row.amount || row.Amount || '0') || 0
  }));
  
  return mappedData;
}

function validateCustomerData(customers: CustomerData[]): string[] {
  const errors: string[] = [];
  
  customers.forEach((customer, index) => {
    if (!customer.name || customer.name.trim() === '') {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    
    if (!customer.email || customer.email.trim() === '') {
      errors.push(`Row ${index + 1}: Email is required`);
    } else if (!isValidEmail(customer.email)) {
      errors.push(`Row ${index + 1}: Invalid email format for ${customer.email}`);
    }
    
    if (isNaN(customer.total_spending) || customer.total_spending < 0) {
      errors.push(`Row ${index + 1}: Total spending must be a non-negative number`);
    }
  });
  
  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function determineTierFromSpending(spending: number, tiers: any[]): any {
  // Sort tiers by min_spend in descending order to find the highest qualifying tier
  const sortedTiers = [...tiers].sort((a, b) => b.min_amount - a.min_amount);
  
  for (const tier of sortedTiers) {
    if (spending >= tier.min_amount && tier.is_active) {
      return tier;
    }
  }
  
  // Return the lowest active tier if no higher tier is qualified
  const lowestTier = tiers
    .filter((t: any) => t.is_active)
    .sort((a: any, b: any) => a.min_amount - b.min_amount)[0];
  
  return lowestTier || null;
}

// Helper function to create a transaction for a customer
async function createTransactionForCustomer(customerId: string, amount: number, description: string) {
  // Import dynamically to avoid circular dependencies
  const { sql } = await import('@vercel/postgres');
  
  // Insert transaction using amount column
  const result = await sql`
    INSERT INTO transactions (customer_id, amount, reference)
    VALUES (${customerId}, ${amount}, ${description || 'Initial spend from bulk upload'})
    RETURNING *
  `;
  
  return result.rows[0];
}