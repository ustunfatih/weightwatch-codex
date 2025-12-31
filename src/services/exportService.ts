import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WeightEntry, TargetData, Statistics } from '../types';
import { format } from 'date-fns';

/**
 * Export weight data to CSV
 */
export async function exportToCSV(entries: WeightEntry[], targetData: TargetData): Promise<void> {
  // CSV Header
  const headers = ['Date', 'Day', 'Weight (kg)', 'Change %', 'Change (kg)', 'Daily Change (kg)'];

  // CSV Rows
  const rows = entries.map(entry => [
    entry.date,
    entry.weekDay,
    entry.weight.toString(),
    entry.changePercent.toFixed(2),
    entry.changeKg.toFixed(2),
    entry.dailyChange.toFixed(2),
  ]);

  // Add target data at the end
  rows.push([]);
  rows.push(['Target Data', '', '', '', '', '']);
  rows.push(['Start Date', targetData.startDate, '', '', '', '']);
  rows.push(['Start Weight', targetData.startWeight.toString(), '', '', '', '']);
  rows.push(['End Date', targetData.endDate, '', '', '', '']);
  rows.push(['End Weight', targetData.endWeight.toString(), '', '', '', '']);
  rows.push(['Total Duration (days)', targetData.totalDuration.toString(), '', '', '', '']);
  rows.push(['Total to Lose (kg)', targetData.totalKg.toString(), '', '', '', '']);
  rows.push(['Height (cm)', targetData.height.toString(), '', '', '', '']);

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `weightwatch-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export dashboard to PDF
 */
export async function exportToPDF(elementId: string, filename?: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Capture element as canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Create PDF
  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  // Download PDF
  const pdfFilename = filename || `weightwatch-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  pdf.save(pdfFilename);
}

/**
 * Export a specific element to PNG
 */
export async function exportElementToPNG(elementId: string, filename?: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imageFilename = filename || `weightwatch-chart-${format(new Date(), 'yyyy-MM-dd')}.png`;
  downloadShareImage(imgData, imageFilename);
}

/**
 * Generate sharing card image
 */
export async function generateShareImage(
  stats: Statistics,
  _targetData: TargetData
): Promise<string> {
  // Create a canvas for the sharing card
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas size (optimized for social media)
  canvas.width = 1200;
  canvas.height = 630;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#10b981'); // emerald-500
  gradient.addColorStop(0.5, '#14b8a6'); // teal-500
  gradient.addColorStop(1, '#0ea5e9'); // sky-500

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add semi-transparent overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 60px Clearface, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('My Weight Loss Journey', canvas.width / 2, 100);

  // Stats
  ctx.font = '700 80px Clearface, Georgia, serif';
  ctx.fillText(`${stats.progress.totalLost.toFixed(1)} kg`, canvas.width / 2, 250);

  ctx.font = '500 40px Apercu, sans-serif';
  ctx.fillText('Total Weight Lost', canvas.width / 2, 310);

  // Progress
  ctx.font = '700 60px Clearface, Georgia, serif';
  ctx.fillText(
    `${stats.progress.percentageComplete.toFixed(0)}%`,
    canvas.width / 2,
    420
  );

  ctx.font = '500 40px Apercu, sans-serif';
  ctx.fillText('Progress to Goal', canvas.width / 2, 480);

  // Footer
  ctx.font = '400 30px Apercu, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('Track your journey with Weightwatch', canvas.width / 2, 580);

  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Copy sharing link to clipboard
 */
export async function copyShareLink(url?: string): Promise<void> {
  const shareUrl = url || window.location.href;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(shareUrl);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';

    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Download generated share image
 */
export function downloadShareImage(dataUrl: string, filename?: string): void {
  const link = document.createElement('a');
  link.download = filename || `weightwatch-progress-${format(new Date(), 'yyyy-MM-dd')}.png`;
  link.href = dataUrl;
  link.click();
}
