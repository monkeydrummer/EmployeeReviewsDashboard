import { NextRequest, NextResponse } from 'next/server';
import { getRevieweesList, saveRevieweesList, getManagersList } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { Reviewee } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Get existing data
    const revieweesList = await getRevieweesList();
    const managersList = await getManagersList();

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each line (skip header if present)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header line if it looks like a header
      if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('email'))) {
        continue;
      }

      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      
      if (values.length < 3) {
        errors.push(`Line ${i + 1}: Invalid format (need at least name, email, title)`);
        skipped++;
        continue;
      }

      const [name, email, title, managerEmailsStr] = values;

      // Validate required fields
      if (!name || !email || !title) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        skipped++;
        continue;
      }

      // Check if email already exists
      if (revieweesList.reviewees.some(r => r.email.toLowerCase() === email.toLowerCase())) {
        errors.push(`Line ${i + 1}: Email ${email} already exists`);
        skipped++;
        continue;
      }

      // Process manager emails
      let managerIds: string[] = [];
      if (managerEmailsStr) {
        const managerEmails = managerEmailsStr.split(';').map(e => e.trim()).filter(e => e);
        for (const managerEmail of managerEmails) {
          const manager = managersList.managers.find(m => m.email.toLowerCase() === managerEmail.toLowerCase());
          if (manager) {
            managerIds.push(manager.id);
          } else {
            errors.push(`Line ${i + 1}: Manager ${managerEmail} not found (skipping this manager)`);
          }
        }
      }

      // Create new reviewee
      const newReviewee: Reviewee = {
        id: `emp-${Date.now()}-${imported}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        title: title.trim(),
        managerIds
      };

      revieweesList.reviewees.push(newReviewee);
      imported++;
    }

    // Save updated list
    await saveRevieweesList(revieweesList);

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV file' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV line with proper quote handling
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current.trim());

  return values;
}

