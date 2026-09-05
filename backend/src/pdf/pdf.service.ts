import PDFDocument from 'pdfkit';

export class PdfService {
  

  /**
   * Generates a PDF buffer for a payslip
   */
  async generatePayslipPdf(payslip: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      // Colors & Styling
      const purple = '#714B67';
      const ink = '#09090B';
      const gray = '#71717A';
      const lightBg = '#F4EAF2';

      // Header Banner
      doc.rect(40, 40, 515, 60).fill(lightBg);
      doc.fillColor(purple).fontSize(20).font('Helvetica-Bold').text('PeoplePay360', 55, 52);
      doc.fillColor(ink).fontSize(10).font('Helvetica').text('Official Salary Statement & Payslip', 55, 75);

      doc.fillColor(purple).fontSize(14).font('Helvetica-Bold').text(`STATUS: ${payslip.status}`, 400, 55, { align: 'right' });
      doc.fillColor(gray).fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, 400, 75, { align: 'right' });

      doc.moveDown(2);

      // Company & Employee Info Grid
      const startY = 120;
      doc.rect(40, startY, 515, 90).strokeColor('#E4E4E7').lineWidth(1).stroke();

      // Left Column: Employee Info
      doc.fillColor(purple).fontSize(11).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 55, startY + 10);
      doc.fillColor(ink).fontSize(10).font('Helvetica-Bold').text(`${payslip.employee?.firstName} ${payslip.employee?.lastName}`, 55, startY + 28);
      doc.fillColor(gray).fontSize(9).font('Helvetica').text(`Code: ${payslip.employee?.employeeCode} | Email: ${payslip.employee?.workEmail}`, 55, startY + 43);
      doc.text(`Department: ${payslip.employee?.department?.name || 'General'} | Position: ${payslip.employee?.jobPosition?.title || 'Staff'}`, 55, startY + 58);
      doc.text(`Bank Acc: ${payslip.employee?.bankAccountNumber || 'N/A'} | Location: ${payslip.employee?.workLocation || 'HQ'}`, 55, startY + 73);

      // Right Column: Payrun & Period Info
      doc.fillColor(purple).fontSize(11).font('Helvetica-Bold').text('PAYROLL PERIOD', 350, startY + 10);
      doc.fillColor(ink).fontSize(9).font('Helvetica').text(`Payrun: ${payslip.payrun?.name || 'Batch'}`, 350, startY + 28);
      const pStart = new Date(payslip.periodStartDate).toISOString().split('T')[0];
      const pEnd = new Date(payslip.periodEndDate).toISOString().split('T')[0];
      doc.text(`Period: ${pStart} to ${pEnd}`, 350, startY + 43);
      doc.text(`Contract: ${payslip.contract?.contractReference || 'CTR-DEFAULT'}`, 350, startY + 58);
      doc.text(`Structure: ${payslip.salaryStructure?.name || 'Regular'}`, 350, startY + 73);

      // Working Time Summary
      const timeY = 225;
      doc.rect(40, timeY, 515, 30).fill('#FAFAFA');
      doc.fillColor(ink).fontSize(9).font('Helvetica-Bold').text('ATTENDANCE SUMMARY:', 55, timeY + 10);
      doc.font('Helvetica').text(`Worked Days: ${payslip.workedDays} days  |  Expected Hours: ${payslip.expectedWorkingHours}h  |  Actual Worked: ${payslip.actualWorkedHours}h`, 200, timeY + 10);

      // Salary Breakdown Table Header
      let tableY = 270;
      doc.rect(40, tableY, 515, 24).fill(purple);
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text('SEQ', 50, tableY + 7);
      doc.text('CODE', 85, tableY + 7);
      doc.text('DESCRIPTION / RULE NAME', 150, tableY + 7);
      doc.text('CATEGORY', 330, tableY + 7);
      doc.text('RATE / CALCULATION', 400, tableY + 7);
      doc.text('AMOUNT ($)', 475, tableY + 7, { align: 'right', width: 70 });

      tableY += 24;

      // Table Lines
      const lines = payslip.lines || [];
      lines.forEach((line: any, idx: number) => {
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9F9FB';
        doc.rect(40, tableY, 515, 20).fill(rowBg);

        doc.fillColor(ink).fontSize(8).font('Helvetica');
        doc.text(String(line.sequence), 50, tableY + 6);
        doc.font('Helvetica-Bold').text(line.ruleCode, 85, tableY + 6);
        doc.font('Helvetica').text(line.ruleName, 150, tableY + 6, { width: 170, ellipsis: true });
        doc.text(line.category, 330, tableY + 6);
        doc.fillColor(gray).text(line.formulaSnapshot || '-', 400, tableY + 6, { width: 75, ellipsis: true });

        const isDeduction = line.category === 'DEDUCTION';
        doc.fillColor(isDeduction ? '#DC2626' : '#059669').font('Helvetica-Bold');
        const formattedAmount = `${isDeduction ? '-' : ''}$${line.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        doc.text(formattedAmount, 475, tableY + 6, { align: 'right', width: 70 });

        tableY += 20;
      });

      // Totals Box
      tableY += 10;
      doc.rect(40, tableY, 515, 75).strokeColor('#E4E4E7').lineWidth(1).stroke();

      doc.fillColor(ink).fontSize(10).font('Helvetica-Bold');
      doc.text('Gross Earnings:', 300, tableY + 12);
      doc.fillColor('#059669').text(`$${payslip.grossSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, tableY + 12, { align: 'right', width: 95 });

      doc.fillColor(ink).text('Total Deductions:', 300, tableY + 28);
      doc.fillColor('#DC2626').text(`-$${payslip.totalDeductions?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, tableY + 28, { align: 'right', width: 95 });

      doc.rect(300, tableY + 45, 245, 24).fill(lightBg);
      doc.fillColor(purple).fontSize(12).font('Helvetica-Bold').text('NET SALARY PAYABLE:', 310, tableY + 52);
      doc.text(`$${payslip.netSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 450, tableY + 52, { align: 'right', width: 90 });

      // Footer
      doc.fillColor(gray).fontSize(8).font('Helvetica').text(
        'This is a system-generated document from PeoplePay360 Integrated HR & Payroll Platform. Verified and signed electronically.',
        40,
        760,
        { align: 'center', width: 515 },
      );

      doc.end();
    });
  }
}
