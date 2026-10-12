import prisma from '../src/config/prisma.js';
import { hashPassword } from '../src/modules/auth/auth.utils.js';
import { DEMO_CONFIG } from '../src/config/demo.js';

async function seed() {
  console.log('🌱 Starting Database Seeding with Demo Accounts...');

  // 1. Hash passwords
  const userPasswordHash = await hashPassword(DEMO_CONFIG.USER_PASSWORD);
  const adminPasswordHash = await hashPassword(DEMO_CONFIG.ADMIN_PASSWORD);

  // 2. Upsert Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_CONFIG.USER_EMAIL },
    update: {
      password: userPasswordHash,
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      name: 'Demo Candidate',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    create: {
      email: DEMO_CONFIG.USER_EMAIL,
      password: userPasswordHash,
      name: 'Demo Candidate',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      profile: {
        create: {
          phone: '+1 (555) 234-5678',
          location: 'San Francisco, CA',
          headline: 'Full Stack Software Engineer (React / Node.js / TypeScript)',
          bio: 'Passionate software developer with 4+ years of experience building modern web applications, scalable APIs, and intuitive user interfaces.',
          website: 'https://democandidate.dev',
          linkedinUrl: 'https://linkedin.com/in/democandidate',
          githubUrl: 'https://github.com/democandidate',
          skills: 'TypeScript, React, Next.js, Node.js, Express, PostgreSQL, Prisma, Tailwind CSS, Docker',
        },
      },
    },
  });

  console.log(`👤 Demo User ready: ${demoUser.email} (ID: ${demoUser.id})`);

  // 3. Upsert Demo Admin
  const demoAdmin = await prisma.user.upsert({
    where: { email: DEMO_CONFIG.ADMIN_EMAIL },
    update: {
      password: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      name: 'Demo Administrator',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    },
    create: {
      email: DEMO_CONFIG.ADMIN_EMAIL,
      password: adminPasswordHash,
      name: 'Demo Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      profile: {
        create: {
          phone: '+1 (800) 555-ADMIN',
          location: 'New York, NY',
          headline: 'Platform Operations & Support Lead',
          bio: 'Demo administrative account with view-only preview access to platform monitoring.',
        },
      },
    },
  });

  console.log(`🛡️ Demo Admin ready: ${demoAdmin.email} (ID: ${demoAdmin.id})`);

  // 4. Seed Resumes for Demo User
  const defaultResume = await prisma.resume.upsert({
    where: { id: 'demo-resume-default' },
    update: {},
    create: {
      id: 'demo-resume-default',
      userId: demoUser.id,
      title: 'Full Stack Engineer - 2026 Resume (Master)',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      publicId: 'resumes/demo_fullstack_2026',
      isDefault: true,
    },
  });

  await prisma.resume.upsert({
    where: { id: 'demo-resume-frontend' },
    update: {},
    create: {
      id: 'demo-resume-frontend',
      userId: demoUser.id,
      title: 'Frontend Specialist (React & Next.js)',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      publicId: 'resumes/demo_frontend_spec',
      isDefault: false,
    },
  });

  console.log('📄 Resumes created for Demo User');

  // 5. Seed Realistic Job Applications for Demo User
  const applicationsData = [
    {
      id: 'demo-app-1',
      companyName: 'Stripe',
      companyLogo: 'https://logo.clearbit.com/stripe.com',
      jobTitle: 'Senior Frontend Engineer',
      jobType: 'FULL_TIME' as const,
      location: 'San Francisco, CA (Hybrid)',
      isRemote: false,
      salaryMin: 165000,
      salaryMax: 195000,
      salaryCurrency: 'USD',
      jobUrl: 'https://stripe.com/jobs/frontend-engineer',
      source: 'LINKEDIN' as const,
      status: 'INTERVIEW' as const,
      priority: 'HIGH' as const,
      isFavorite: true,
      description: 'Building developer-first payment dashboards and checkout UI components with high accessibility standards.',
      appliedAt: new Date(Date.now() - 12 * 86400000),
      deadline: new Date(Date.now() + 20 * 86400000),
      resumeId: defaultResume.id,
    },
    {
      id: 'demo-app-2',
      companyName: 'Vercel',
      companyLogo: 'https://logo.clearbit.com/vercel.com',
      jobTitle: 'Full Stack Developer - Next.js Ecosystem',
      jobType: 'REMOTE' as const,
      location: 'Worldwide',
      isRemote: true,
      salaryMin: 150000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      jobUrl: 'https://vercel.com/careers/nextjs-dev',
      source: 'COMPANY_WEBSITE' as const,
      status: 'OFFER' as const,
      priority: 'HIGH' as const,
      isFavorite: true,
      description: 'Working on edge middleware, developer experience, and Next.js compiler tooling.',
      appliedAt: new Date(Date.now() - 25 * 86400000),
      deadline: null,
      resumeId: defaultResume.id,
    },
    {
      id: 'demo-app-3',
      companyName: 'Linear',
      companyLogo: 'https://logo.clearbit.com/linear.app',
      jobTitle: 'Product Software Engineer',
      jobType: 'FULL_TIME' as const,
      location: 'San Francisco, CA',
      isRemote: true,
      salaryMin: 160000,
      salaryMax: 185000,
      salaryCurrency: 'USD',
      jobUrl: 'https://linear.app/careers',
      source: 'REFERRAL' as const,
      status: 'SCREENING' as const,
      priority: 'HIGH' as const,
      isFavorite: true,
      description: 'Crafting keyboard-first project management interfaces with micro-interactions and instant sync.',
      appliedAt: new Date(Date.now() - 4 * 86400000),
      deadline: new Date(Date.now() + 14 * 86400000),
      resumeId: defaultResume.id,
    },
    {
      id: 'demo-app-4',
      companyName: 'Shopify',
      companyLogo: 'https://logo.clearbit.com/shopify.com',
      jobTitle: 'Backend Engineer - Payments Platform',
      jobType: 'FULL_TIME' as const,
      location: 'Ottawa, Canada (Remote)',
      isRemote: true,
      salaryMin: 140000,
      salaryMax: 165000,
      salaryCurrency: 'USD',
      jobUrl: 'https://shopify.com/careers',
      source: 'INDEED' as const,
      status: 'APPLIED' as const,
      priority: 'MEDIUM' as const,
      isFavorite: false,
      description: 'High throughput checkout processing and idempotent webhook delivery.',
      appliedAt: new Date(Date.now() - 6 * 86400000),
      deadline: new Date(Date.now() + 10 * 86400000),
      resumeId: defaultResume.id,
    },
    {
      id: 'demo-app-5',
      companyName: 'Figma',
      companyLogo: 'https://logo.clearbit.com/figma.com',
      jobTitle: 'Web Applications UI Engineer',
      jobType: 'FULL_TIME' as const,
      location: 'San Francisco, CA',
      isRemote: false,
      salaryMin: 155000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      jobUrl: 'https://figma.com/careers',
      source: 'LINKEDIN' as const,
      status: 'REJECTED' as const,
      priority: 'MEDIUM' as const,
      isFavorite: false,
      description: 'Collaborative real-time design platform canvas controls.',
      appliedAt: new Date(Date.now() - 35 * 86400000),
      deadline: null,
      resumeId: defaultResume.id,
    },
  ];

  for (const app of applicationsData) {
    await prisma.jobApplication.upsert({
      where: { id: app.id },
      update: {},
      create: {
        ...app,
        userId: demoUser.id,
      },
    });
  }

  console.log(`💼 Seeded ${applicationsData.length} Job Applications for Demo User`);

  // 6. Seed Interviews
  await prisma.interview.upsert({
    where: { id: 'demo-int-1' },
    update: {},
    create: {
      id: 'demo-int-1',
      userId: demoUser.id,
      applicationId: 'demo-app-1',
      type: 'TECHNICAL',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 2 * 86400000), // In 2 days
      meetingLink: 'https://meet.google.com/abc-demo-xyz',
      interviewerName: 'Sarah Jenkins (Tech Lead)',
      interviewerEmail: 's.jenkins@stripe.com',
      notes: 'Prepare system design diagrams for large-scale dashboard state caching and optimistic UI updates.',
    },
  });

  await prisma.interview.upsert({
    where: { id: 'demo-int-2' },
    update: {},
    create: {
      id: 'demo-int-2',
      userId: demoUser.id,
      applicationId: 'demo-app-2',
      type: 'FINAL',
      status: 'PASSED',
      scheduledAt: new Date(Date.now() - 3 * 86400000),
      meetingLink: 'https://zoom.us/j/demo12345678',
      interviewerName: 'Guillermo Rauch',
      notes: 'Executive conversation regarding company culture, remote workflows, and team alignment. Went exceptionally well!',
    },
  });

  console.log('🎤 Seeded Interviews for Demo User');

  // 7. Seed Follow-ups
  await prisma.followUp.upsert({
    where: { id: 'demo-followup-1' },
    update: {},
    create: {
      id: 'demo-followup-1',
      userId: demoUser.id,
      applicationId: 'demo-app-3',
      title: 'Send thank-you email & inquire about Screening progress',
      description: 'Follow up with recruiter regarding the initial screening feedback from Linear.',
      scheduledAt: new Date(Date.now() + 1 * 86400000),
      status: 'PENDING',
    },
  });

  await prisma.followUp.upsert({
    where: { id: 'demo-followup-2' },
    update: {},
    create: {
      id: 'demo-followup-2',
      userId: demoUser.id,
      applicationId: 'demo-app-4',
      title: 'Check application portal status on Shopify Careers',
      description: 'Check if status changed to Under Review.',
      scheduledAt: new Date(Date.now() - 2 * 86400000),
      completedAt: new Date(Date.now() - 2 * 86400000),
      status: 'COMPLETED',
    },
  });

  console.log('⏰ Seeded Follow-ups for Demo User');

  // 8. Seed Notes
  await prisma.note.upsert({
    where: { id: 'demo-note-1' },
    update: {},
    create: {
      id: 'demo-note-1',
      userId: demoUser.id,
      applicationId: 'demo-app-1',
      content: 'Stripe recruiter mentioned compensation band starts at $165k base + equity. Expected 4 rounds total.',
    },
  });

  await prisma.note.upsert({
    where: { id: 'demo-note-2' },
    update: {},
    create: {
      id: 'demo-note-2',
      userId: demoUser.id,
      applicationId: 'demo-app-2',
      content: 'Official Offer Letter received on October 10th! Benefits include 401(k) matching, health insurance, and home-office budget.',
    },
  });

  console.log('📝 Seeded Notes for Demo User');

  // 9. Seed Notifications
  await prisma.notification.upsert({
    where: { id: 'demo-notif-1' },
    update: {},
    create: {
      id: 'demo-notif-1',
      userId: demoUser.id,
      type: 'INTERVIEW',
      title: 'Upcoming Technical Interview: Stripe',
      message: 'Your Technical Round with Sarah Jenkins is scheduled in 2 days at 10:00 AM.',
      isRead: false,
      metadata: { applicationId: 'demo-app-1', interviewId: 'demo-int-1' },
    },
  });

  await prisma.notification.upsert({
    where: { id: 'demo-notif-2' },
    update: {},
    create: {
      id: 'demo-notif-2',
      userId: demoUser.id,
      type: 'APPLICATION',
      title: 'Job Offer Received: Vercel',
      message: 'Congratulations! Your status for Full Stack Developer at Vercel was updated to OFFER.',
      isRead: true,
      readAt: new Date(Date.now() - 1 * 86400000),
      metadata: { applicationId: 'demo-app-2' },
    },
  });

  console.log('🔔 Seeded Notifications for Demo User');

  // 10. Seed Support Tickets for Demo User
  await prisma.supportTicket.upsert({
    where: { id: 'demo-ticket-user-1' },
    update: {},
    create: {
      id: 'demo-ticket-user-1',
      userId: demoUser.id,
      subject: 'Feature Request: Export Applications to Notion',
      description: 'Would love an option to sync or export my weekly applied jobs directly into my Notion job search board.',
      status: 'OPEN',
    },
  });

  console.log('🎫 Seeded Support Tickets for Demo User');

  console.log('🎉 ==============================================');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`👤 Demo User Credentials:`);
  console.log(`   Email:    ${DEMO_CONFIG.USER_EMAIL}`);
  console.log(`   Password: ${DEMO_CONFIG.USER_PASSWORD}`);
  console.log(`🛡️ Demo Admin Credentials:`);
  console.log(`   Email:    ${DEMO_CONFIG.ADMIN_EMAIL}`);
  console.log(`   Password: ${DEMO_CONFIG.ADMIN_PASSWORD}`);
  console.log('🎉 ==============================================');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
