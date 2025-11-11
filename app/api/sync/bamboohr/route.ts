import { NextRequest, NextResponse } from 'next/server';
import { getRevieweesList, getManagersList } from '@/lib/storage';
import https from 'https';

// BambooHR Configuration
const BAMBOO_API_KEY = process.env.BAMBOO_API_KEY || 'f5a6034e9d328ce8b89ba6d5db6d53b45a7257e7';
const BAMBOO_SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN || 'rocscience';

interface BambooEmployee {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  supervisorEmail?: string;
  emailGenerated?: boolean; // Flag to indicate email was auto-generated
}

interface SyncChange {
  type: 'add' | 'update' | 'remove';
  employeeId?: string;
  name: string;
  email: string;
  title?: string;
  currentTitle?: string;
  newTitle?: string;
  managerEmail?: string;
  emailGenerated?: boolean; // Flag if email was auto-generated
  bambooData?: BambooEmployee;
}

/**
 * Clean name for email generation
 */
function cleanNameForEmail(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '') // Remove special characters, spaces, etc.
    .replace(/\s+/g, '');
}

/**
 * Extract English name from parentheses, or return original if none
 * e.g., "Jeongheon (Jake) Yang" -> returns "Jake" for first name
 */
function extractEnglishName(fullName: string, isFirstName: boolean): string {
  const parenMatch = fullName.match(/\(([^)]+)\)/);
  
  if (parenMatch) {
    // English name found in parentheses
    return parenMatch[1].trim();
  }
  
  // No parentheses, extract first or last name from full name
  const parts = fullName.trim().split(/\s+/);
  if (isFirstName) {
    return parts[0] || '';
  } else {
    return parts[parts.length - 1] || '';
  }
}

/**
 * Normalize name for comparison (handles parenthetical names)
 */
function normalizeNameForMatching(name: string): string[] {
  const normalized = name.toLowerCase().trim();
  const variants: string[] = [normalized];
  
  // Extract name in parentheses if present, e.g., "Jeongheon (Jake) Yang" -> "Jake Yang"
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const parenthetical = parenMatch[1];
    // Create variant without parentheses: "Jeongheon Yang"
    const withoutParen = normalized.replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    variants.push(withoutParen);
    
    // Create variant with just parenthetical name: "Jake Yang"
    const nameParts = normalized.split(/\s+/);
    const lastNameIndex = nameParts.length - 1;
    if (lastNameIndex > 0) {
      const withParenName = `${parenthetical.toLowerCase()} ${nameParts[lastNameIndex]}`.trim();
      variants.push(withParenName);
    }
  }
  
  return variants;
}

/**
 * Check if two names match (considering variations)
 */
function namesMatch(name1: string, name2: string): boolean {
  const variants1 = normalizeNameForMatching(name1);
  const variants2 = normalizeNameForMatching(name2);
  
  // Check if any variant matches
  for (const v1 of variants1) {
    for (const v2 of variants2) {
      if (v1 === v2) return true;
    }
  }
  
  return false;
}

/**
 * Fetch employees from BambooHR
 */
async function fetchBambooHREmployees(): Promise<BambooEmployee[]> {
  // Fetch directory
  const directory = await new Promise<any>((resolve, reject) => {
    const options = {
      hostname: 'api.bamboohr.com',
      path: `/api/gateway.php/${BAMBOO_SUBDOMAIN}/v1/employees/directory`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${BAMBOO_API_KEY}:x`).toString('base64')}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error: any) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`BambooHR API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });

  console.log('Directory response:', JSON.stringify(directory, null, 2).substring(0, 500));
  
  if (!directory || !directory.employees) {
    throw new Error('No employees found in BambooHR');
  }
  
  if (directory.employees.length === 0) {
    throw new Error('Employee directory is empty');
  }

  // Fetch detailed info for each employee
  const employees: BambooEmployee[] = [];
  const fields = ['firstName', 'lastName', 'workEmail', 'jobTitle', 'supervisor', 'supervisorEmail'];
  
  console.log(`Processing ${directory.employees.length} employees from BambooHR directory`);
  
  for (const emp of directory.employees) {
    try {
      const details = await new Promise<any>((resolve, reject) => {
        const fieldsParam = fields.join(',');
        const options = {
          hostname: 'api.bamboohr.com',
          path: `/api/gateway.php/${BAMBOO_SUBDOMAIN}/v1/employees/${emp.id}?fields=${fieldsParam}`,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${BAMBOO_API_KEY}:x`).toString('base64')}`
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(data));
              } catch (error: any) {
                reject(new Error(`Failed to parse response: ${error.message}`));
              }
            } else {
              reject(new Error(`API returned status ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      // Try to get email from details or fallback to directory data
      let workEmail = details.workEmail || emp.workEmail || emp.email;
      const firstName = details.firstName || emp.firstName || '';
      const lastName = details.lastName || emp.lastName || '';
      let emailGenerated = false;
      
      // If no email, generate one from name
      if (!workEmail && firstName && lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        // Extract English names (from parentheses if present)
        const englishFirstName = extractEnglishName(fullName, true);
        const englishLastName = lastName.replace(/\s*\([^)]+\)\s*/g, '').trim(); // Remove any parentheses from last name
        
        const cleanFirst = cleanNameForEmail(englishFirstName);
        const cleanLast = cleanNameForEmail(englishLastName);
        workEmail = `${cleanFirst}.${cleanLast}@rocscience.com`;
        emailGenerated = true;
        console.log(`Generated email for ${firstName} ${lastName}: ${workEmail} (using English name: ${englishFirstName} ${englishLastName})`);
      } else if (!workEmail && firstName) {
        const englishFirstName = extractEnglishName(firstName, true);
        const cleanFirst = cleanNameForEmail(englishFirstName);
        workEmail = `${cleanFirst}@rocscience.com`;
        emailGenerated = true;
        console.log(`Generated email for ${firstName}: ${workEmail}`);
      }
      
      if (workEmail && (firstName || lastName)) {
        employees.push({
          id: emp.id,
          firstName: firstName,
          lastName: lastName,
          workEmail: workEmail,
          jobTitle: details.jobTitle || emp.jobTitle || '',
          supervisorEmail: details.supervisorEmail || '',
          emailGenerated: emailGenerated
        });
      } else {
        console.log(`Skipping employee without sufficient info: ${emp.displayName || emp.firstName || 'unknown'}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`Error fetching details for ${emp.displayName || emp.firstName}:`, error.message);
      // Add basic info even if details fail
      let workEmail = emp.workEmail || emp.email;
      const firstName = emp.firstName || '';
      const lastName = emp.lastName || '';
      let emailGenerated = false;
      
      // Generate email if missing
      if (!workEmail && firstName && lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        // Extract English names (from parentheses if present)
        const englishFirstName = extractEnglishName(fullName, true);
        const englishLastName = lastName.replace(/\s*\([^)]+\)\s*/g, '').trim(); // Remove any parentheses from last name
        
        const cleanFirst = cleanNameForEmail(englishFirstName);
        const cleanLast = cleanNameForEmail(englishLastName);
        workEmail = `${cleanFirst}.${cleanLast}@rocscience.com`;
        emailGenerated = true;
        console.log(`Generated email for ${firstName} ${lastName}: ${workEmail} (using English name: ${englishFirstName} ${englishLastName})`);
      } else if (!workEmail && firstName) {
        const englishFirstName = extractEnglishName(firstName, true);
        const cleanFirst = cleanNameForEmail(englishFirstName);
        workEmail = `${cleanFirst}@rocscience.com`;
        emailGenerated = true;
        console.log(`Generated email for ${firstName}: ${workEmail}`);
      }
      
      if (workEmail && (firstName || lastName)) {
        employees.push({
          id: emp.id,
          firstName: firstName,
          lastName: lastName,
          workEmail: workEmail,
          jobTitle: emp.jobTitle || '',
          supervisorEmail: '',
          emailGenerated: emailGenerated
        });
        console.log(`Added basic info for ${emp.displayName || emp.firstName}`);
      }
    }
  }

  console.log(`Successfully processed ${employees.length} employees with emails`);
  return employees;
}

/**
 * Compare BambooHR data with current reviewees
 */
function compareEmployees(bambooEmployees: BambooEmployee[], currentReviewees: any[]): SyncChange[] {
  const changes: SyncChange[] = [];
  const bambooByEmail = new Map(bambooEmployees.map(e => [e.workEmail.toLowerCase(), e]));
  const currentByEmail = new Map(currentReviewees.map(r => [r.email.toLowerCase(), r]));
  const processedReviewees = new Set<string>(); // Track which reviewees we've matched

  // Find new employees and updates
  for (const bambooEmp of bambooEmployees) {
    const email = bambooEmp.workEmail.toLowerCase();
    let current = currentByEmail.get(email);
    const fullName = `${bambooEmp.firstName} ${bambooEmp.lastName}`.trim();

    // If no email match, try name matching (for cases where email format differs)
    if (!current && !bambooEmp.emailGenerated) {
      for (const reviewee of currentReviewees) {
        if (namesMatch(fullName, reviewee.name)) {
          current = reviewee;
          console.log(`Matched by name: "${fullName}" (BambooHR) <-> "${reviewee.name}" (System)`);
          break;
        }
      }
    }

    if (!current) {
      // New employee
      changes.push({
        type: 'add',
        name: fullName,
        email: bambooEmp.workEmail,
        title: bambooEmp.jobTitle,
        managerEmail: bambooEmp.supervisorEmail,
        emailGenerated: bambooEmp.emailGenerated,
        bambooData: bambooEmp
      });
    } else {
      // Mark as processed
      processedReviewees.add(current.id);
      
      // Check for updates
      const titleChanged = bambooEmp.jobTitle !== current.title;
      const emailChanged = bambooEmp.workEmail.toLowerCase() !== current.email.toLowerCase();
      
      if (titleChanged || emailChanged) {
        changes.push({
          type: 'update',
          employeeId: current.id,
          name: current.name,
          email: emailChanged ? bambooEmp.workEmail : current.email,
          currentTitle: current.title,
          newTitle: bambooEmp.jobTitle,
          managerEmail: bambooEmp.supervisorEmail,
          bambooData: bambooEmp
        });
      }
    }
  }

  // Find removed employees (in system but not in BambooHR)
  for (const reviewee of currentReviewees) {
    // Skip if already matched by name or email
    if (processedReviewees.has(reviewee.id)) continue;
    
    const email = reviewee.email.toLowerCase();
    let foundInBamboo = bambooByEmail.has(email);
    
    // Try name matching as well
    if (!foundInBamboo) {
      for (const bambooEmp of bambooEmployees) {
        const fullName = `${bambooEmp.firstName} ${bambooEmp.lastName}`.trim();
        if (namesMatch(reviewee.name, fullName)) {
          foundInBamboo = true;
          break;
        }
      }
    }
    
    if (!foundInBamboo) {
      changes.push({
        type: 'remove',
        employeeId: reviewee.id,
        name: reviewee.name,
        email: reviewee.email,
        title: reviewee.title
      });
    }
  }

  return changes;
}

export async function POST(request: NextRequest) {
  try {
    const { adminEmail } = await request.json();

    // Verify admin authentication
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 });
    }

    console.log('Starting BambooHR sync...');
    
    // Fetch data
    const [bambooEmployees, revieweesList] = await Promise.all([
      fetchBambooHREmployees(),
      getRevieweesList()
    ]);

    console.log(`Fetched ${bambooEmployees.length} employees from BambooHR`);
    console.log(`Current system has ${revieweesList.reviewees.length} reviewees`);

    // Compare and generate changes
    const changes = compareEmployees(bambooEmployees, revieweesList.reviewees);

    console.log(`Found ${changes.length} changes`);

    return NextResponse.json({
      success: true,
      changes,
      totalEmployeesInBamboo: bambooEmployees.length,
      totalEmployeesInSystem: revieweesList.reviewees.length,
      debugInfo: {
        bambooEmployeeSample: bambooEmployees.slice(0, 3).map(e => ({ name: `${e.firstName} ${e.lastName}`, email: e.workEmail }))
      }
    });

  } catch (error: any) {
    console.error('Error syncing with BambooHR:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Failed to sync with BambooHR',
      details: error.toString(),
      stack: error.stack
    }, { status: 500 });
  }
}

