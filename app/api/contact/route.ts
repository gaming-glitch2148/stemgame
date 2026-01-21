import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, contact, topic, message } = await req.json();

    // In a real production app, you would use a service like Resend, SendGrid, or Nodemailer.
    // For a simple implementation that works on Vercel, we'll log it and you can
    // integrate a free tier of Resend.com (highly recommended).

    console.log('Contact Form Submission:', { name, contact, topic, message });

    // Example of how you'd send to your email via a service:
    /*
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Contact Form <onboarding@resend.dev>',
        to: 'digitaloutpostllc@gmail.com',
        subject: `Contact Form: ${topic}`,
        text: `Name: ${name}\nContact: ${contact}\nTopic: ${topic}\n\nMessage:\n${message}`,
      }),
    });
    */

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}
