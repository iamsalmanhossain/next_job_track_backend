import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { sendEmail } from '../shared/email.service.js';

/**
 * 1. Follow-up Reminders:
 * Runs every day at 09:00 AM (server time).
 * Finds pending follow-ups due today and creates in-app notification & sends email.
 */
export const scheduleFollowUpReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('⏰ Running Follow-up Reminders cron job...');
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const dueFollowUps = await prisma.followUp.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          user: true,
          jobApplication: true,
        },
      });

      for (const item of dueFollowUps) {
        const company = item.jobApplication?.companyName || 'Job Application';
        const position = item.jobApplication?.jobTitle || '';

        // Prevent duplicate notification for today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: item.userId,
            type: 'FOLLOW_UP',
            metadata: {
              equals: { followUpId: item.id },
            },
          },
        });

        if (!existingNotification) {
          const title = `Reminder: Follow-up for ${company}`;
          const message = `You have a follow-up scheduled today: "${item.title}".`;

          // In-app notification
          await prisma.notification.create({
            data: {
              userId: item.userId,
              type: 'FOLLOW_UP',
              title,
              message,
              metadata: { followUpId: item.id, applicationId: item.applicationId },
            },
          });

          // Email notification
          if (item.user?.email) {
            const emailHtml = `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>Follow-up Reminder</h2>
                <p>Hello ${item.user.name || 'there'},</p>
                <p>You have a follow-up due today for <strong>${company}</strong> (${position}).</p>
                <p><strong>Task:</strong> ${item.title}</p>
                ${item.description ? `<p><strong>Details:</strong> ${item.description}</p>` : ''}
                <br/>
                <p>Best regards,<br/>Next Job Track Team</p>
              </div>
            `;
            await sendEmail(item.user.email, `Follow-up Reminder: ${company}`, emailHtml);
          }
        }
      }
    } catch (error) {
      console.error('Error in scheduleFollowUpReminders cron:', error);
    }
  });
};

/**
 * 2. Interview Reminders:
 * Runs every hour.
 * Finds scheduled interviews within the next 24 hours and alerts the candidate.
 */
export const scheduleInterviewReminders = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Running Interview Reminders cron job...');
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingInterviews = await prisma.interview.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: now,
            lte: in24Hours,
          },
        },
        include: {
          user: true,
          jobApplication: true,
        },
      });

      for (const item of upcomingInterviews) {
        const company = item.jobApplication?.companyName || 'Company';
        const position = item.jobApplication?.jobTitle || 'the role';

        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: item.userId,
            type: 'INTERVIEW',
            metadata: {
              equals: { interviewId: item.id },
            },
          },
        });

        if (!existingNotification) {
          const interviewDate = new Date(item.scheduledAt).toLocaleString();
          const title = `Upcoming Interview: ${company}`;
          const message = `Your ${item.type} interview for ${position} is scheduled for ${interviewDate}.`;

          await prisma.notification.create({
            data: {
              userId: item.userId,
              type: 'INTERVIEW',
              title,
              message,
              metadata: { interviewId: item.id, applicationId: item.applicationId },
            },
          });

          if (item.user?.email) {
            const emailHtml = `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>Upcoming Interview Reminder</h2>
                <p>Hello ${item.user.name || 'there'},</p>
                <p>This is a reminder that you have an upcoming interview with <strong>${company}</strong>.</p>
                <ul>
                  <li><strong>Position:</strong> ${position}</li>
                  <li><strong>Type:</strong> ${item.type}</li>
                  <li><strong>Time:</strong> ${interviewDate}</li>
                  ${item.meetingLink ? `<li><strong>Link:</strong> <a href="${item.meetingLink}">${item.meetingLink}</a></li>` : ''}
                  ${item.interviewerName ? `<li><strong>Interviewer:</strong> ${item.interviewerName}</li>` : ''}
                </ul>
                <br/>
                <p>Good luck!<br/>Next Job Track Team</p>
              </div>
            `;
            await sendEmail(item.user.email, `Interview Reminder: ${company}`, emailHtml);
          }
        }
      }
    } catch (error) {
      console.error('Error in scheduleInterviewReminders cron:', error);
    }
  });
};

/**
 * 3. Session Cleanup:
 * Runs once every midnight (00:00).
 * Deletes expired sessions from the database.
 */
export const scheduleSessionCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🧹 Running Expired Sessions Cleanup cron job...');
      const deleted = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      console.log(`🧹 Cleaned up ${deleted.count} expired sessions.`);
    } catch (error) {
      console.error('Error in scheduleSessionCleanup cron:', error);
    }
  });
};

/**
 * 4. Closed Support Tickets Cleanup:
 * Runs once every midnight (00:15).
 * Auto-deletes support tickets that have been CLOSED for more than 15 days.
 */
export const scheduleSupportTicketCleanup = () => {
  cron.schedule('15 0 * * *', async () => {
    try {
      console.log('🧹 Running Closed Support Tickets Cleanup cron job...');
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.supportTicket.deleteMany({
        where: {
          status: 'CLOSED',
          updatedAt: {
            lt: fifteenDaysAgo,
          },
        },
      });

      console.log(`🧹 Cleaned up ${deleted.count} closed support tickets older than 15 days.`);
    } catch (error) {
      console.error('Error in scheduleSupportTicketCleanup cron:', error);
    }
  });
};

/**
 * 5. Old Audit Logs Cleanup:
 * Runs once every midnight (00:30).
 * Auto-deletes audit logs that are older than 30 days.
 */
export const scheduleAuditLogCleanup = () => {
  cron.schedule('30 0 * * *', async () => {
    try {
      console.log('🧹 Running Old Audit Logs Cleanup cron job...');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log(`🧹 Cleaned up ${deleted.count} audit logs older than 30 days.`);
    } catch (error) {
      console.error('Error in scheduleAuditLogCleanup cron:', error);
    }
  });
};

export const initCronJobs = () => {
  scheduleFollowUpReminders();
  scheduleInterviewReminders();
  scheduleSessionCleanup();
  scheduleSupportTicketCleanup();
  scheduleAuditLogCleanup();
  console.log('✅ Background Cron Jobs initialized.');
};

