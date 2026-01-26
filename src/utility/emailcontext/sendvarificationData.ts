interface EmailContextType {
  sendVerificationData: (
    username: string,
    otp: number,
    subject: string
  ) => string;
}

const emailContext: EmailContextType = {
  sendVerificationData: (
    username: string,
    otp: number,
    subject: string
  ): string => {

    
    // =====================
    // Validation
    // =====================
    if (!username || typeof username !== 'string') {
      throw new Error('Username must be a non-empty string');
    }

    // 6-digit OTP validation
    if (
      !otp ||
      typeof otp !== 'number' ||
      otp < 100000 ||
      otp > 999999
    ) {
      throw new Error('OTP must be a 6-digit number');
    }

    if (!subject || typeof subject !== 'string') {
      throw new Error('Subject must be a non-empty string');
    }

    // =====================
    // Utilities
    // =====================
    const currentYear = new Date().getFullYear();

    // Escape username to prevent HTML injection
    const escapedUsername = username.replace(/[<>&"]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
      };
      return escapeMap[char] || char;
    });

    // =====================
    // Email Template
    // =====================
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .container {
      padding: 20px;
      border-radius: 6px;
      background-color: #f9f9f9;
      border: 1px solid #dddddd;
    }
    .header {
      text-align: center;
      padding: 12px;
      background-color: #4CAF50;
      color: #ffffff;
      border-radius: 6px 6px 0 0;
    }
    .content {
      padding: 20px;
      background-color: #ffffff;
      border-radius: 0 0 6px 6px;
    }
    .otp-code {
      font-size: 26px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 4px;
      padding: 12px;
      margin: 24px 0;
      background-color: #f0f0f0;
      border-radius: 4px;
      font-family: monospace;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      margin-top: 20px;
      color: #666666;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 12px;
      }
      .content {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Email Verification</h2>
    </div>
    <div class="content">
      <p>Hello ${escapedUsername},</p>
      <p>
        Thank you for registering with our service.
        Please use the <strong>6-digit verification code</strong> below:
      </p>

      <div class="otp-code" aria-label="Verification Code">
        ${otp}
      </div>

      <p><strong>Important:</strong> This code will expire in 10 minutes.</p>
      <p>If you did not request this verification, please ignore this email.</p>

      <p>
        Best regards,<br />
        The Support Team
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>&copy; ${currentYear} Your Company Name. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  },
};

export default emailContext;
