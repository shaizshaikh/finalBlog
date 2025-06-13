
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
    return []; // Return empty array on error to prevent further issues in sendNewArticleNotification
  }
}

export async function sendNewArticleNotification(article: Article) {
  console.log(`Attempting to send new article notification for: "${article.title}"`);
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn('Gmail credentials not configured. Skipping new article notification.');
      return;
    }
    if (!process.env.BASE_URL) {
      console.warn('BASE_URL environment variable not configured. Skipping new article notification as links will be broken.');
      return;
    }

    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      console.log('No active subscribers to notify for article:', article.title);
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
          <p><a href="${process.env.BASE_URL}/articles/${article.slug}">Read more</a></p>
          <hr>
          <p><small>To unsubscribe, please visit <a href="${process.env.BASE_URL}/unsubscribe">our unsubscribe page</a>.</small></p>
        `,
      };
      return transporter.sendMail(mailOptions)
        .then(() => console.log(`Notification sent to ${email} for article "${article.title}"`))
        .catch(err => console.error(`Failed to send notification to ${email} for article "${article.title}":`, err)); // Catch per-email errors
    });

    // Using Promise.allSettled to ensure all email sending attempts are made, regardless of individual failures.
    const results = await Promise.allSettled(mailPromises);
    
    let sentCount = 0;
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        sentCount++;
      }
    });
    console.log(`Successfully attempted to send new article notifications. ${sentCount}/${subscribers.length} emails potentially sent for article "${article.title}".`);

  } catch (error) {
    // This top-level catch will handle errors from getActiveSubscribers or nodemailer.createTransport
    console.error(`Critical error in sendNewArticleNotification for article "${article.title}":`, error);
    // Depending on requirements, you might want to re-throw or handle differently.
    // For now, we log it to prevent an unhandled rejection that could cause an ISE.
  }
}

export async function unsubscribeFromNewsletter(email: string): Promise<SubscribeResult> {
  const validationResult = emailSchema.safeParse(email);
  if (!validationResult.success) {
    return { success: false, message: validationResult.error.issues[0].message };
  }
  const validatedEmail = validationResult.data;
  console.log(`Attempting to unsubscribe email: ${validatedEmail}`);
  try {
    const subscriberCheck = await pool.query(
      'SELECT * FROM subscribers WHERE email = $1',
      [validatedEmail]
    );

    if (subscriberCheck.rows.length === 0) {
      return { success: false, message: 'This email address is not subscribed.' };
    }

    if (!subscriberCheck.rows[0].is_active) {
      return { success: true, message: 'This email address has already been unsubscribed.' };
    }
    
    await pool.query('UPDATE subscribers SET is_active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP WHERE email = $1', [validatedEmail]);
    console.log(`Successfully unsubscribed: ${validatedEmail}`);
    return { success: true, message: `Successfully unsubscribed ${validatedEmail}. You will no longer receive new article notifications.` };
  } catch (error) {
    console.error('Unsubscription database error:', error);
    return { success: false, message: 'An error occurred during unsubscription. Please try again later.' };
  }
}
