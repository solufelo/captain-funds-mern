import nodemailer from 'nodemailer';

// Email is optional. With SMTP settings in .env it sends through nodemailer;
// without them every send is logged and skipped, so the app never crashes
// on missing mail credentials.
export const emailConfigured = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : {
      async sendMail(options) {
        console.log(`[email] not configured; skipped "${options.subject}"`);
        return { messageId: 'not-sent' };
      },
      async verify() {
        return false;
      },
    };

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to Captain Funds! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Captain Funds!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your journey to making a difference starts here</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining Captain Funds, the platform where your generosity can change lives and support meaningful causes.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What you can do:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>🎯 Discover and support amazing campaigns</li>
              <li>💝 Make secure donations to causes you care about</li>
              <li>📊 Track your donation history and impact</li>
              <li>🚀 Create your own fundraising campaigns</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Explore Campaigns
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Questions? Reply to this email or contact our support team.
          </p>
        </div>
      </div>
    `
  }),

  donationReceived: (donorName, campaignTitle, amount, organizerName) => ({
    subject: `New donation received for "${campaignTitle}" 💝`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 New Donation Received!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Great news, ${organizerName}!</h2>
          
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #48bb78;">
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              <strong>${donorName}</strong> just made a donation of <strong style="color: #48bb78; font-size: 18px;">$${amount}</strong> to your campaign:
            </p>
            
            <h3 style="color: #333; margin: 15px 0;">"${campaignTitle}"</h3>
            
            <p style="color: #666; line-height: 1.6;">
              This generous contribution brings you one step closer to your fundraising goal. Keep up the great work!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/campaigns" 
               style="background: #48bb78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Campaign Details
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for making a difference with Captain Funds!
          </p>
        </div>
      </div>
    `
  }),

  donationConfirmation: (donorName, campaignTitle, amount, organizerName) => ({
    subject: `Thank you for your donation to "${campaignTitle}" 🙏`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Thank You! 💝</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your generosity makes a difference</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Dear ${donorName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your generous donation! Your contribution is making a real impact.
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h3 style="color: #333; margin-top: 0;">Donation Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f5f9;"><strong>Campaign:</strong></td>
                <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f5f9;">${campaignTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f5f9;"><strong>Organizer:</strong></td>
                <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f5f9;">${organizerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f5f9;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; color: #48bb78; font-size: 18px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">$${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e6fffa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
            <p style="color: #2d3748; line-height: 1.6; margin: 0;">
              <strong>🌟 Impact:</strong> Your donation directly supports this cause and helps create positive change in the community. Thank you for being part of the solution!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/donations" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Your Donations
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Keep making a difference! Explore more campaigns on Captain Funds.
          </p>
        </div>
      </div>
    `
  }),

  campaignApproved: (organizerName, campaignTitle) => ({
    subject: `Your campaign "${campaignTitle}" has been approved! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Campaign Approved!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Congratulations, ${organizerName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your campaign <strong>"${campaignTitle}"</strong> has been reviewed and approved by our team.
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #48bb78;">
            <h3 style="color: #333; margin-top: 0;">What happens next:</h3>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
              <li>✅ Your campaign is now live and visible to all users</li>
              <li>🎯 People can start making donations immediately</li>
              <li>📊 You'll receive real-time updates on donations</li>
              <li>💌 You'll get email notifications for each donation</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/campaigns" 
               style="background: #48bb78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Your Live Campaign
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Share your campaign with friends and family to maximize your impact!
          </p>
        </div>
      </div>
    `
  }),

  campaignGoalReached: (organizerName, campaignTitle, targetAmount) => ({
    subject: `🎯 Goal Reached! "${campaignTitle}" is fully funded!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎯 Goal Achieved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your campaign has reached its target!</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Amazing work, ${organizerName}! 🎉</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Congratulations! Your campaign <strong>"${campaignTitle}"</strong> has successfully reached its funding goal of <strong style="color: #f5576c;">$${targetAmount}</strong>!
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #f5576c;">
            <h3 style="color: #333; margin-top: 0;">🌟 What an achievement!</h3>
            <p style="color: #666; line-height: 1.6; margin: 0;">
              Thanks to the generous support of your donors, you've reached your fundraising goal. This is a testament to the importance of your cause and the power of community support.
            </p>
          </div>
          
          <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #333; margin-top: 0;">Next Steps:</h4>
            <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Your campaign will continue to accept donations if you wish</li>
              <li>Keep your supporters updated on how funds are being used</li>
              <li>Consider sharing success stories and impact updates</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/campaigns" 
               style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Manage Your Campaign
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for making a positive impact with Captain Funds!
          </p>
        </div>
      </div>
    `
  })
};

// Email service functions
export const emailService = {
  // Send welcome email to new users
  async sendWelcomeEmail(userEmail, userName) {
    try {
      const template = emailTemplates.welcome(userName);
      
      const mailOptions = {
        from: `"Captain Funds" <${process.env.EMAIL_FROM || 'noreply@captainfunds.com'}>`,
        to: userEmail,
        subject: template.subject,
        html: template.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send donation confirmation to donor
  async sendDonationConfirmation(donorEmail, donorName, campaignTitle, amount, organizerName) {
    try {
      const template = emailTemplates.donationConfirmation(donorName, campaignTitle, amount, organizerName);
      
      const mailOptions = {
        from: `"Captain Funds" <${process.env.EMAIL_FROM || 'noreply@captainfunds.com'}>`,
        to: donorEmail,
        subject: template.subject,
        html: template.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Donation confirmation sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending donation confirmation:', error);
      return { success: false, error: error.message };
    }
  },

  // Send donation notification to campaign organizer
  async sendDonationNotification(organizerEmail, donorName, campaignTitle, amount, organizerName) {
    try {
      const template = emailTemplates.donationReceived(donorName, campaignTitle, amount, organizerName);
      
      const mailOptions = {
        from: `"Captain Funds" <${process.env.EMAIL_FROM || 'noreply@captainfunds.com'}>`,
        to: organizerEmail,
        subject: template.subject,
        html: template.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Donation notification sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending donation notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send campaign approval notification
  async sendCampaignApproval(organizerEmail, organizerName, campaignTitle) {
    try {
      const template = emailTemplates.campaignApproved(organizerName, campaignTitle);
      
      const mailOptions = {
        from: `"Captain Funds" <${process.env.EMAIL_FROM || 'noreply@captainfunds.com'}>`,
        to: organizerEmail,
        subject: template.subject,
        html: template.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Campaign approval sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending campaign approval:', error);
      return { success: false, error: error.message };
    }
  },

  // Send goal reached notification
  async sendGoalReachedNotification(organizerEmail, organizerName, campaignTitle, targetAmount) {
    try {
      const template = emailTemplates.campaignGoalReached(organizerName, campaignTitle, targetAmount);
      
      const mailOptions = {
        from: `"Captain Funds" <${process.env.EMAIL_FROM || 'noreply@captainfunds.com'}>`,
        to: organizerEmail,
        subject: template.subject,
        html: template.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Goal reached notification sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending goal reached notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send custom email
  async sendCustomEmail(to, subject, htmlContent, textContent = '') {
    try {
      const mailOptions = {
        from: `"Captain Funds" <${process.env.EMAIL_FROM || 'noreply@captainfunds.com'}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Custom email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending custom email:', error);
      return { success: false, error: error.message };
    }
  },

  // Test email configuration
  async testEmailConfig() {
    try {
      const testEmail = await transporter.verify();
      console.log('Email configuration test:', testEmail ? 'SUCCESS' : 'FAILED');
      return { success: testEmail, message: testEmail ? 'Email service is working' : 'Email service failed' };
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default emailService;
