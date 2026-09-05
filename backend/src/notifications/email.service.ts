
export interface PayslipEmailOptions {
  to: string;
  employeeName: string;
  period: string;
  netSalary: number;
  payslipId: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  sentAt: Date;
  status: 'DELIVERED' | 'FAILED';
  preview: string;
}

export class EmailService {
  
  private emailLogs: EmailLogEntry[] = [];

  async sendPayslipNotification(options: PayslipEmailOptions): Promise<boolean> {
    const subject = `Your Payslip for Period: ${options.period} [PeoplePay360]`;
    const preview = `Dear ${options.employeeName}, your net salary of $${options.netSalary.toLocaleString()} for period ${options.period} has been processed and credited.`;

    console.log(`[EMAIL DISPATCH] To: ${options.to} | Subject: ${subject}`);

    this.emailLogs.unshift({
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: options.to,
      subject,
      sentAt: new Date(),
      status: 'DELIVERED',
      preview,
    });

    return true;
  }

  getRecentLogs(): EmailLogEntry[] {
    return this.emailLogs.slice(0, 50);
  }
}
