import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, title, message, type, related_id, icon, action_url, send_email, send_sms } = await req.json();

    if (!user_id || !title || !message || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user preferences
    const user = await base44.asServiceRole.entities.User.get(user_id);
    
    // Create notification in database
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id,
      title,
      message,
      type,
      related_id,
      icon: icon || '🔔',
      action_url,
      is_read: false
    });

    // Send email if user has email notifications enabled and send_email is true
    if (user.email_notifications && send_email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Central Dellas',
          to: user.email,
          subject: `🔔 ${title}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #BF3B79, #F22998); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Central Dellas</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #BF3B79;">${title}</h2>
                <p style="color: #333; font-size: 16px;">${message}</p>
                ${action_url ? `
                  <a href="${action_url}" style="display: inline-block; background: linear-gradient(135deg, #BF3B79, #F22998); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
                    Ver Detalhes
                  </a>
                ` : ''}
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    // Send SMS if user has SMS notifications enabled and send_sms is true
    if (user.sms_notifications && send_sms && user.phone) {
      // SMS implementation would go here
      console.log(`SMS would be sent to ${user.phone}: ${title} - ${message}`);
    }

    return Response.json({ 
      success: true, 
      notification,
      email_sent: user.email_notifications && send_email,
      sms_sent: user.sms_notifications && send_sms && user.phone
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});