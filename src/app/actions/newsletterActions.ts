
'use server';

import { z } from 'zod';

// In a real application, you would import your database client (e.g., pg for PostgreSQL)
// and interact with the 'subscribers' table here.
// For now, this is a placeholder.
// import { db } from '@/lib/db'; // Assuming you'll have a db utility

const emailSchema = z.string().email({ message: "Invalid email address." });

interface SubscribeResult {
  success: boolean;
  message: string;
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  const validationResult = emailSchema.safeParse(email);

  if (!validationResult.success) {
    return { success: false, message: validationResult.error.issues[0].message };
  }

  const validatedEmail = validationResult.data;

  console.log(`Attempting to subscribe email: ${validatedEmail}`);

  try {
    // Placeholder for database interaction:
    // const existingSubscriber = await db.query('SELECT * FROM subscribers WHERE email = $1 AND is_active = TRUE', [validatedEmail]);
    // if (existingSubscriber.rows.length > 0) {
    //   return { success: true, message: 'You are already subscribed!' };
    // }
    // await db.query('INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET is_active = TRUE, subscribed_at = CURRENT_TIMESTAMP', [validatedEmail]);
    
    // Simulate successful subscription for now
    console.log(`Successfully subscribed (simulated): ${validatedEmail}`);
    return { success: true, message: `Successfully subscribed with ${validatedEmail}. Thank you!` };

  } catch (error) {
    console.error('Subscription error:', error);
    // In a real app, log the error more robustly
    return { success: false, message: 'An error occurred during subscription. Please try again later.' };
  }
}

// We will add the email sending logic later, likely in the article creation flow.
// For example:
// import nodemailer from 'nodemailer';
// import type { Article } from '@/types';

// async function getActiveSubscribers(): Promise<string[]> {
//   // const result = await db.query('SELECT email FROM subscribers WHERE is_active = TRUE');
//   // return result.rows.map(row => row.email);
//   return ["test1@example.com", "test2@example.com"]; // Placeholder
// }

// export async function sendNewArticleNotification(article: Article) {
//   const subscribers = await getActiveSubscribers();
//   if (subscribers.length === 0) {
//     console.log('No active subscribers to notify.');
//     return;
//   }

//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.GMAIL_USER,
//       pass: process.env.GMAIL_PASS,
//     },
//   });

//   const mailPromises = subscribers.map(email => {
//     const mailOptions = {
//       from: process.env.GMAIL_USER,
//       to: email,
//       subject: `New Article Published: ${article.title}`,
//       html: `
//         <h1>${article.title}</h1>
//         <p>${article.excerpt || article.content.substring(0, 200)}...</p>
//         <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/articles/${article.slug}">Read more</a></p>
//       `,
//     };
//     return transporter.sendMail(mailOptions);
//   });

//   try {
//     await Promise.all(mailPromises);
//     console.log(`Successfully sent new article notifications to ${subscribers.length} subscribers.`);
//   } catch (error) {
//     console.error('Failed to send some new article notifications:', error);
//   }
// }
