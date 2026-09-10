import jsPDF from 'jspdf';

export function buildGuestbookPdf(eventName, messages = []) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const gold = [230, 197, 71];

  const drawPageBackground = (cover = false) => {
    pdf.setFillColor(...(cover ? [26, 20, 13] : [255, 250, 240]));
    pdf.rect(0, 0, 210, 297, 'F');
    pdf.setDrawColor(...gold);
    pdf.setLineWidth(cover ? 1.2 : 0.8);
    pdf.rect(8, 8, 194, 281);
    pdf.rect(15, 15, 180, 267);
  };

  drawPageBackground(true);
  pdf.setTextColor(...gold);
  pdf.setFont('times', 'bolditalic');
  pdf.setFontSize(12);
  pdf.text("LIVRE D'OR OFFICIEL", 105, 105, { align: 'center' });
  pdf.setFontSize(30);
  const title = pdf.splitTextToSize(eventName || 'PartyLens', 150);
  pdf.text(title, 105, 140, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text('PARTYLENS', 105, 190, { align: 'center' });

  messages.forEach((message, index) => {
    pdf.addPage();
    drawPageBackground(false);
    pdf.setTextColor(143, 108, 10);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(11);
    pdf.text(`Folio ${index + 1}`, 178, 29, { align: 'right' });
    pdf.setTextColor(26, 15, 5);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(19);
    const text = message.message || message.text || '(Message vocal)';
    const lines = pdf.splitTextToSize(`"${text}"`, 155);
    const startY = 125 - ((lines.length - 1) * 5);
    pdf.text(lines, 105, startY, { align: 'center', maxWidth: 155 });
    pdf.setFontSize(13);
    pdf.setTextColor(80, 50, 20);
    pdf.text(`— ${message.author || 'Anonyme'}`, 165, startY + lines.length * 9 + 18, { align: 'right' });
  });

  return pdf;
}
