
'use server';

import { z } from 'zod';
import pool from '@/lib/db'; // Import the PostgreSQL pool
import nodemailer from 'nodemailer';
import type { Article } from '@/types'; // Assuming you'll reuse this type

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
    // Check if email already exists and is active
    const existingSubscriber = await pool.query(
      'SELECT * FROM subscribers WHERE email = $1 AND is_active = TRUE',
      [validatedEmail]
    );

    if (existingSubscriber.rows.length > 0) {
      return { success: true, message: 'You are already subscribed and active!' };
    }

    // Insert or update subscriber (if they were inactive and re-subscribed)
    // ON CONFLICT ensures that if the email exists, it updates is_active and subscribed_at
    await pool.query(
      `INSERT INTO subscribers (email, is_active, subscribed_at) 
       VALUES ($1, TRUE, CURRENT_TIMESTAMP)
       ON CONFLICT (email) 
       DO UPDATE SET is_active = TRUE, subscribed_at = CURRENT_TIMESTAMP`,
      [validatedEmail]
    );
    
    console.log(`Successfully subscribed: ${validatedEmail}`);
    return { success: true, message: `Successfully subscribed with ${validatedEmail}. Thank you!` };

  } catch (error) {
    console.error('Subscription database error:', error);
    // In a real app, log the error more robustly
    return { success: false, message: 'An error occurred during subscription. Please try again later.' };
  }
}


async function getActiveSubscribers(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT email FROM subscribers WHERE is_active = TRUE');
    return result.rows.map(row => row.email);
  } catch (error) {
    console.error('Failed to fetch active subscribers:', error);
    return [];
  }
}

export async function sendNewArticleNotification(article: Article) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('Gmail credentials not configured. Skipping new article notification.');
    return;
  }
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.warn('NEXT_PUBLIC_BASE_URL not configured. Skipping new article notification as links will be broken.');
    return;
  }

  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) {
    console.log('No active subscribers to notify.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // Use App Password
    },
  });

  const mailPromises = subscribers.map(email => {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `New Article Published: ${article.title}`,
      html: `
        <h1>${article.title}</h1>
        <p>${article.excerpt || article.content.substring(0, 200)}...</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/articles/${article.slug}">Read more</a></p>
        <hr>
        <p><small>To unsubscribe, please visit our website (unsubscribe link coming soon!).</small></p>
      `,
    };
    return transporter.sendMail(mailOptions)
      .then(() => console.log(`Notification sent to ${email}`))
      .catch(err => console.error(`Failed to send notification to ${email}:`, err));
  });

  try {
    await Promise.all(mailPromises);
    console.log(`Successfully attempted to send new article notifications to ${subscribers.length} subscribers.`);
  } catch (error) {
    console.error('Failed to send some new article notifications:', error);
  }
}

// Example of an unsubscribe function (you'll need a UI for this)
// export async function unsubscribeFromNewsletter(email: string): Promise<SubscribeResult> {
//   const validationResult = emailSchema.safeParse(email);
//   if (!validationResult.success) {
//     return { success: false, message: validationResult.error.issues[0].message };
//   }
//   const validatedEmail = validationResult.data;
//   try {
//     await pool.query('UPDATE subscribers SET is_active = FALSE WHERE email = $1', [validatedEmail]);
//     return { success: true, message: `Successfully unsubscribed ${validatedEmail}.` };
//   } catch (error) {
//     console.error('Unsubscription error:', error);
//     return { success: false, message: 'An error occurred during unsubscription.' };
//   }
// }
