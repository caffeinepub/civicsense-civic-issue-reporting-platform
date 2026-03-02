import type { backendInterface, Submission } from '../backend';
import { Category, Priority, Status } from '../backend';
import { Principal } from '@dfinity/principal';

const SEED_KEY = 'civicsense_seeded_v1';

function generateId(): string {
  return `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// A stable anonymous-looking principal for seed data
const SEED_PRINCIPAL = Principal.fromText('2vxsx-fae');

const sampleIssues: Omit<Submission, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'attachments'>[] = [
  {
    title: 'Large pothole on MG Road near bus stop',
    description: 'A deep pothole approximately 2 feet wide has formed near the main bus stop on MG Road. It is causing damage to vehicles and is a safety hazard for two-wheelers.',
    category: Category.potholes,
    priority: Priority.high,
    status: Status.inProgress,
    address: { street: 'MG Road, Near Bus Stop', city: 'Bangalore', zipCode: '560001' },
    location: { latitude: 12.9716, longitude: 77.5946 },
    assignedStaff: undefined,
  },
  {
    title: 'Overflowing garbage bin at Koramangala market',
    description: 'The garbage bin near Koramangala market has been overflowing for 3 days. Waste is spilling onto the footpath and causing a foul smell in the area.',
    category: Category.waste,
    priority: Priority.high,
    status: Status.open,
    address: { street: 'Koramangala Market Road', city: 'Bangalore', zipCode: '560034' },
    location: { latitude: 12.9352, longitude: 77.6245 },
    assignedStaff: undefined,
  },
  {
    title: 'Street light not working on Indiranagar 100ft Road',
    description: 'Three consecutive street lights on 100ft Road, Indiranagar are not functioning for the past week. The area becomes very dark at night, posing safety risks.',
    category: Category.streetlights,
    priority: Priority.medium,
    status: Status.resolved,
    address: { street: '100ft Road, Indiranagar', city: 'Bangalore', zipCode: '560038' },
    location: { latitude: 12.9784, longitude: 77.6408 },
    assignedStaff: undefined,
  },
  {
    title: 'Broken footpath tiles near Jayanagar park',
    description: 'Multiple footpath tiles near Jayanagar 4th Block park are broken and uneven. Elderly citizens and children are at risk of tripping and falling.',
    category: Category.other,
    priority: Priority.medium,
    status: Status.open,
    address: { street: '4th Block, Jayanagar', city: 'Bangalore', zipCode: '560041' },
    location: { latitude: 12.9250, longitude: 77.5938 },
    assignedStaff: undefined,
  },
  {
    title: 'Illegal dumping of construction waste on Whitefield Road',
    description: 'Construction debris and waste material has been illegally dumped on the roadside near Whitefield main road, blocking part of the lane and creating a hazard.',
    category: Category.waste,
    priority: Priority.high,
    status: Status.inProgress,
    address: { street: 'Whitefield Main Road', city: 'Bangalore', zipCode: '560066' },
    location: { latitude: 12.9698, longitude: 77.7499 },
    assignedStaff: undefined,
  },
  {
    title: 'Multiple potholes on Sarjapur Road stretch',
    description: 'A 500-meter stretch of Sarjapur Road has developed multiple potholes after recent rains. Traffic is severely affected and accidents have been reported.',
    category: Category.potholes,
    priority: Priority.high,
    status: Status.open,
    address: { street: 'Sarjapur Road, Near Wipro Gate', city: 'Bangalore', zipCode: '560035' },
    location: { latitude: 12.9010, longitude: 77.6770 },
    assignedStaff: undefined,
  },
  {
    title: 'Street light flickering at HSR Layout Sector 2',
    description: 'A street light at the main junction of HSR Layout Sector 2 is flickering continuously at night. It is causing discomfort to residents and may indicate an electrical fault.',
    category: Category.streetlights,
    priority: Priority.low,
    status: Status.resolved,
    address: { street: 'Sector 2, HSR Layout', city: 'Bangalore', zipCode: '560102' },
    location: { latitude: 12.9116, longitude: 77.6389 },
    assignedStaff: undefined,
  },
  {
    title: 'Garbage not collected for 5 days in BTM Layout',
    description: 'Garbage collection has not happened in BTM Layout 2nd Stage for 5 consecutive days. Waste is piling up outside homes and attracting stray animals.',
    category: Category.waste,
    priority: Priority.high,
    status: Status.open,
    address: { street: '2nd Stage, BTM Layout', city: 'Bangalore', zipCode: '560076' },
    location: { latitude: 12.9166, longitude: 77.6101 },
    assignedStaff: undefined,
  },
  {
    title: 'Damaged road divider on Outer Ring Road',
    description: 'The road divider near Marathahalli junction on Outer Ring Road has been damaged, likely due to a vehicle collision. It poses a risk to motorists.',
    category: Category.other,
    priority: Priority.medium,
    status: Status.inProgress,
    address: { street: 'Outer Ring Road, Marathahalli', city: 'Bangalore', zipCode: '560037' },
    location: { latitude: 12.9591, longitude: 77.6974 },
    assignedStaff: undefined,
  },
  {
    title: 'Pothole causing accidents near Electronic City flyover',
    description: 'A large pothole at the base of Electronic City flyover has caused two minor accidents this week. Immediate repair is needed to prevent further incidents.',
    category: Category.potholes,
    priority: Priority.high,
    status: Status.resolved,
    address: { street: 'Electronic City Phase 1', city: 'Bangalore', zipCode: '560100' },
    location: { latitude: 12.8399, longitude: 77.6770 },
    assignedStaff: undefined,
  },
  {
    title: 'Open manhole on Residency Road',
    description: 'An open manhole without any cover or warning signs has been spotted on Residency Road. This is extremely dangerous for pedestrians and cyclists, especially at night.',
    category: Category.other,
    priority: Priority.high,
    status: Status.inProgress,
    address: { street: 'Residency Road', city: 'Bangalore', zipCode: '560025' },
    location: { latitude: 12.9719, longitude: 77.6012 },
    assignedStaff: undefined,
  },
  {
    title: 'Street lights out in entire block of Rajajinagar',
    description: 'All street lights in the 3rd Block of Rajajinagar have been non-functional for 10 days. Residents are concerned about safety and have reported increased incidents of theft.',
    category: Category.streetlights,
    priority: Priority.high,
    status: Status.open,
    address: { street: '3rd Block, Rajajinagar', city: 'Bangalore', zipCode: '560010' },
    location: { latitude: 12.9915, longitude: 77.5530 },
    assignedStaff: undefined,
  },
  {
    title: 'Waterlogging due to blocked drain on Church Street',
    description: 'A blocked storm drain on Church Street is causing severe waterlogging after every rain. The water level rises to knee height and disrupts traffic and pedestrian movement.',
    category: Category.other,
    priority: Priority.medium,
    status: Status.resolved,
    address: { street: 'Church Street', city: 'Bangalore', zipCode: '560001' },
    location: { latitude: 12.9762, longitude: 77.6033 },
    assignedStaff: undefined,
  },
  {
    title: 'Overflowing sewage near Vijayanagar bus stand',
    description: 'Sewage is overflowing from a broken pipe near Vijayanagar bus stand. The foul smell and unhygienic conditions are affecting commuters and nearby shop owners.',
    category: Category.waste,
    priority: Priority.high,
    status: Status.open,
    address: { street: 'Vijayanagar Bus Stand', city: 'Bangalore', zipCode: '560040' },
    location: { latitude: 12.9719, longitude: 77.5350 },
    assignedStaff: undefined,
  },
  {
    title: 'Pothole on Bannerghatta Road near NIMHANS',
    description: 'A pothole on Bannerghatta Road near NIMHANS junction is causing traffic slowdowns. Vehicles are swerving to avoid it, creating dangerous situations.',
    category: Category.potholes,
    priority: Priority.medium,
    status: Status.open,
    address: { street: 'Bannerghatta Road, Near NIMHANS', city: 'Bangalore', zipCode: '560029' },
    location: { latitude: 12.9399, longitude: 77.5950 },
    assignedStaff: undefined,
  },
];

export async function seedSampleData(actor: backendInterface): Promise<void> {
  // Check if already seeded
  if (localStorage.getItem(SEED_KEY)) {
    return;
  }

  try {
    // Check if there are already issues in the backend
    const existingIssues = await actor.getAllSubmissions();
    if (existingIssues.length >= 5) {
      // Already has data, mark as seeded and skip
      localStorage.setItem(SEED_KEY, 'true');
      return;
    }

    // Seed the sample issues
    const now = BigInt(Date.now()) * BigInt(1_000_000); // nanoseconds

    for (let i = 0; i < sampleIssues.length; i++) {
      const issue = sampleIssues[i];
      const id = `seed_${i + 1}_${Math.random().toString(36).substr(2, 6)}`;

      const submission: Submission = {
        id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        address: issue.address,
        location: issue.location,
        assignedStaff: undefined,
        createdBy: SEED_PRINCIPAL,
        createdAt: now - BigInt(i * 86400 * 1_000_000_000), // stagger dates
        updatedAt: now - BigInt(i * 43200 * 1_000_000_000),
        attachments: [],
      };

      try {
        await actor.createSubmission(submission);
      } catch {
        // Individual issue creation may fail (e.g., not authenticated), skip silently
      }
    }

    localStorage.setItem(SEED_KEY, 'true');
  } catch {
    // Seeding failed silently - don't break the app
  }
}
