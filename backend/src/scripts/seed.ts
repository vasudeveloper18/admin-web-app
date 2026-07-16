import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserSchema } from '../users/schemas/user.schema';
import { RoleSchema } from '../users/schemas/role.schema';
import { JobSchema, JobStatus } from '../jobs/schemas/job.schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admin-web-app';

// Unsplash image links for HVAC, electrical, and plumbing repairs
const PHOTO_POOL = [
  'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=600&auto=format&fit=crop',
];

const CUSTOMER_POOL = [
  { name: 'John Miller', phone: '617-555-0143', email: 'john.miller@example.com' },
  { name: 'Sarah Connor', phone: '617-555-0182', email: 'sarah.connor@example.com' },
  { name: 'Robert Chen', phone: '617-555-0199', email: 'robert.chen@example.com' },
  { name: 'Emily Davis', phone: '617-555-0121', email: 'emily.davis@example.com' },
  { name: 'Michael Brown', phone: '617-555-0155', email: 'michael.brown@example.com' },
  { name: 'Jessica Taylor', phone: '617-555-0166', email: 'jessica.taylor@example.com' },
  { name: 'David Wilson', phone: '617-555-0177', email: 'david.wilson@example.com' },
  { name: 'Ashley Martinez', phone: '617-555-0188', email: 'ashley.martinez@example.com' },
];

const JOB_TEMPLATES = [
  { title: 'AC Compressor Replacement', description: 'Replace worn out compressor unit on the rooftop condenser.' },
  { title: 'Emergency Pipe Leak Repair', description: 'Fix burst copper pipe in basement. Shut off valve inspected.' },
  { title: 'Circuit Breaker Box Upgrade', description: 'Replace outdated 100A panel with new 200A electrical service panel.' },
  { title: 'Smart Thermostat Installation', description: 'Install Nest Smart Thermostat and verify dual-zone HVAC integration.' },
  { title: 'Drain Clog Hydro-Jetting', description: 'Clear grease clog in main kitchen sewer line using hydro-jetting equipment.' },
  { title: 'Rooftop Exhaust Fan Service', description: 'Inspect belts, lubricate bearings, and clean fan blades on ventilation unit.' },
  { title: 'Light Fixture Wiring Installation', description: 'Run conduit and wire 6 new LED pendant lights in reception lobby.' },
  { title: 'Commercial Faucet Rebuild', description: 'Replace cartridges and seals on industrial kitchen triple sink faucet.' },
];

const BOSTON_STREETS = [
  'Beacon St', 'Boylston St', 'Washington St', 'Tremont St', 'Newbury St',
  'Hanover St', 'Commonwealth Ave', 'Columbus Ave', 'Massachusetts Ave', 'State St'
];

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  const Role = mongoose.model('Role', RoleSchema);
  const User = mongoose.model('User', UserSchema);
  const Job = mongoose.model('Job', JobSchema);

  console.log('Clearing existing collections...');
  await Role.deleteMany({});
  await User.deleteMany({});
  await Job.deleteMany({});

  // ─── Seed Roles master table ───────────────────────────────────────────────
  console.log('Seeding Roles master table...');
  const adminRole = await new Role({
    name: 'ADMIN',
    description: 'Full access to admin panel, job management, and user management.',
  }).save();

  const technicianRole = await new Role({
    name: 'TECHNICIAN',
    description: 'Field technician who can view and update assigned jobs.',
  }).save();

  console.log(`  ✔ Created role: ${adminRole.name} (id: ${adminRole._id})`);
  console.log(`  ✔ Created role: ${technicianRole.name} (id: ${technicianRole._id})`);

  console.log('Generating password hashes...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', salt);
  const techPasswordHash = await bcrypt.hash('TechPass123!', salt);

  console.log('Seeding Users...');
  const admin = await new User({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    roleId: adminRole._id,
  }).save();

  const technicians = [];
  const techNames = [
    { first: 'Marcus', last: 'Vance', email: 'marcus@fieldops.com' },
    { first: 'Elena', last: 'Rostova', email: 'elena@fieldops.com' },
    { first: 'David', last: 'Kim', email: 'david@fieldops.com' },
    { first: 'Tariq', last: 'Jamil', email: 'tariq@fieldops.com' },
  ];

  for (const tech of techNames) {
    const createdTech = await new User({
      firstName: tech.first,
      lastName: tech.last,
      email: tech.email,
      passwordHash: techPasswordHash,
      role: 'TECHNICIAN',
      roleId: technicianRole._id,
    }).save();
    technicians.push(createdTech);
  }

  console.log('Seeding 40 Jobs spread across the last 18 months...');
  const totalJobs = 40;
  const now = new Date();
  
  // Status breakdown: 24 Completed, 5 Cancelled, 4 In Progress, 4 Assigned, 3 Pending
  const statuses = [
    ...Array(24).fill(JobStatus.COMPLETED),
    ...Array(5).fill(JobStatus.CANCELLED),
    ...Array(4).fill(JobStatus.IN_PROGRESS),
    ...Array(4).fill(JobStatus.ASSIGNED),
    ...Array(3).fill(JobStatus.PENDING),
  ];

  // Shuffle statuses to ensure random date distribution
  statuses.sort(() => Math.random() - 0.5);

  const jobsToCreate = [];

  for (let i = 0; i < totalJobs; i++) {
    const status = statuses[i];
    
    // Distribute scheduled date uniformly over the past 18 months
    // 18 months = ~540 days. Let's pick a random number of days in the past
    const daysAgo = Math.floor(Math.random() * 540);
    const scheduledDate = new Date();
    scheduledDate.setDate(now.getDate() - daysAgo);
    scheduledDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0); // Scheduled between 8 AM and 4 PM

    // Select random customer & job template & street
    const customer = CUSTOMER_POOL[i % CUSTOMER_POOL.length];
    const template = JOB_TEMPLATES[i % JOB_TEMPLATES.length];
    const streetNum = Math.floor(Math.random() * 300) + 1;
    const street = BOSTON_STREETS[i % BOSTON_STREETS.length];
    const address = `${streetNum} ${street}, Boston, MA`;

    // Coordinates: center around Boston Common (42.3554, -71.0662)
    // Add minor variation ±0.04 (approx 4-5 km spread)
    const latOffset = (Math.random() - 0.5) * 0.08;
    const lngOffset = (Math.random() - 0.5) * 0.08;
    const latitude = Number((42.3554 + latOffset).toFixed(6));
    const longitude = Number((-71.0662 + lngOffset).toFixed(6));

    let assignedTechnician = null;
    let completedDate = null;
    let completionNotes = undefined;
    let completionPhotos: string[] = [];
    let cancelReason = undefined;

    // Set properties based on status
    if (status !== JobStatus.PENDING) {
      assignedTechnician = technicians[i % technicians.length]._id;
    }

    if (status === JobStatus.IN_PROGRESS) {
      // Scheduled date is likely today or yesterday
      scheduledDate.setDate(now.getDate() - (i % 2));
    }

    if (status === JobStatus.COMPLETED) {
      completedDate = new Date(scheduledDate);
      completedDate.setHours(completedDate.getHours() + 2 + Math.floor(Math.random() * 3)); // Completed 2-5 hours later
      completionNotes = `Job completed successfully. Checked system operations and verified no remaining issues. Customer approved.`;
      
      // Select 1-2 random photos
      const numPhotos = Math.floor(Math.random() * 2) + 1;
      const shuffledPhotos = [...PHOTO_POOL].sort(() => Math.random() - 0.5);
      completionPhotos = shuffledPhotos.slice(0, numPhotos);
    }

    if (status === JobStatus.CANCELLED) {
      cancelReason = 'Customer requested cancellation due to scheduling conflicts or emergency cancellation.';
    }

    jobsToCreate.push({
      title: template.title,
      description: template.description,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      address,
      latitude,
      longitude,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      status,
      assignedTechnician,
      completionNotes,
      completionPhotos,
      scheduledDate,
      completedDate,
      cancelReason,
    });
  }

  await Job.insertMany(jobsToCreate);
  console.log(`Successfully seeded ${totalJobs} jobs!`);

  console.log('Seeded accounts info:');
  console.log('=================================');
  console.log(`Admin Email:      admin@example.com`);
  console.log(`Admin Password:   Admin123!`);
  console.log('---------------------------------');
  console.log(`Technicians Email: marcus@fieldops.com, elena@fieldops.com, ...`);
  console.log(`Tech Password:     TechPass123!`);
  console.log('=================================');

  await mongoose.disconnect();
  console.log('Database disconnected. Seeding completed.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
