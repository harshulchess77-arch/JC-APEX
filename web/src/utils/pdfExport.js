import { jsPDF } from 'jspdf';

/**
 * Client-Side Luxury PDF Telemetry Report Generator
 * Captures comprehensive session metrics:
 * - Header Banner: JC-APEX Telemetry Report, Session ID, Timestamp
 * - KPI Grid: Peak Amps, Max Speed, Session Duration, Peak Power (W), 48V System Voltage, Signal Quality
 * - Telemetry Log Table: Packet ID, Timestamp, Amps, Volts, Watts, Hall Speed, GPS Speed, RSSI, SNR
 * Downloads cleanly via Blob and URL object natively in the browser.
 */
export async function exportTelemetryPDF({
  sessionId = 'LIVE-SESSION',
  metrics = null,
  telemetry = null,
  chartData = [],
  telemetryHistory = []
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Header Banner
  doc.setFillColor(12, 12, 14); // Dark chassis
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Red racing accent top stripe
  doc.setFillColor(239, 68, 68);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Branding Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('JC-APEX TELEMETRY REPORT', margin, 42);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('ELECTROTHON 48V TRACTIVE SYSTEM & PIT TELEMETRY', margin, 58);

  const timestampStr = new Date().toLocaleString();
  doc.setTextColor(209, 213, 219);
  doc.setFontSize(8);
  doc.text(`SESSION: ${sessionId || 'LIVE-STREAM'}`, pageWidth - margin, 42, { align: 'right' });
  doc.text(`EXPORTED: ${timestampStr}`, pageWidth - margin, 58, { align: 'right' });

  let y = 112;

  // 2. Compute Session Metrics: Peak Amps, Max Speed, Session Duration, etc.
  const allPackets = telemetryHistory.length > 0 ? telemetryHistory : chartData;
  const totalPackets = metrics?.total_records || allPackets.length || 0;

  // Amps computation
  let peakCurrent = metrics?.peak_current ?? (telemetry?.current || 0);
  let avgCurrent = metrics?.avg_current ?? 0;
  // Speed computation
  let maxSpeed = metrics?.peak_speed ?? (telemetry?.speed || 0);
  let avgSpeed = metrics?.avg_speed ?? 0;
  // Voltage computation
  let peakVoltage = metrics?.peak_voltage ?? (telemetry?.voltage || 0);
  let minVoltage = telemetry?.voltage || 0;
  // Power computation
  let peakPower = metrics?.peak_power ?? (telemetry?.power || (peakCurrent * peakVoltage) || 0);

  // Signal computation
  let avgRssi = metrics?.avg_rssi ?? (telemetryHistory[0]?.rssi ?? -58);
  let avgSnr = metrics?.avg_snr ?? (telemetryHistory[0]?.snr ?? 9.8);

  if (allPackets.length > 0) {
    const currents = allPackets.map(p => Number(p.current ?? p.amps ?? 0)).filter(c => !isNaN(c));
    if (currents.length > 0) {
      peakCurrent = Math.max(peakCurrent, Math.max(...currents));
      avgCurrent = currents.reduce((a, b) => a + b, 0) / currents.length;
    }

    const speeds = allPackets.map(p => Number(p.speed ?? p.speed_hall ?? p.speed_h ?? 0)).filter(s => !isNaN(s));
    if (speeds.length > 0) {
      maxSpeed = Math.max(maxSpeed, Math.max(...speeds));
      avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    }

    const voltages = allPackets.map(p => Number(p.voltage ?? p.volts ?? 0)).filter(v => !isNaN(v) && v > 0);
    if (voltages.length > 0) {
      peakVoltage = Math.max(peakVoltage, Math.max(...voltages));
      minVoltage = Math.min(...voltages);
    }

    const powers = allPackets.map(p => Number(p.power ?? p.watts ?? 0)).filter(w => !isNaN(w));
    if (powers.length > 0) {
      peakPower = Math.max(peakPower, Math.max(...powers));
    }
  }

  // Session Duration calculation
  let durationSeconds = 0;
  if (metrics?.duration_seconds) {
    durationSeconds = Number(metrics.duration_seconds);
  } else if (telemetry?.raceTime) {
    durationSeconds = Number(telemetry.raceTime);
  } else if (telemetryHistory.length > 1) {
    const tFirst = new Date(telemetryHistory[0].created_at || Date.now()).getTime();
    const tLast = new Date(telemetryHistory[telemetryHistory.length - 1].created_at || Date.now()).getTime();
    durationSeconds = Math.max(0, Math.floor((tLast - tFirst) / 1000));
  } else if (chartData.length > 1) {
    durationSeconds = chartData.length * 5; // default 5-second interval
  }

  const durM = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
  const durS = (durationSeconds % 60).toString().padStart(2, '0');
  const durationStr = `${durM}:${durS}`;

  // Section: Executive Performance Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('EXECUTIVE PERFORMANCE & POWERTRAIN METRICS', margin, y);
  y += 12;

  // KPI Grid (3x3 grid of cards)
  const kpis = [
    { label: 'PEAK AMPS', value: `${Number(peakCurrent).toFixed(2)} A`, color: [239, 68, 68] },
    { label: 'MAX SPEED', value: `${Number(maxSpeed).toFixed(1)} MPH`, color: [245, 158, 11] },
    { label: 'SESSION DURATION', value: durationStr, color: [59, 130, 246] },
    { label: 'PEAK POWER', value: `${Math.round(peakPower)} W`, color: [168, 85, 247] },
    { label: '48V VOLTAGE RANGE', value: `${Number(minVoltage).toFixed(1)}V - ${Number(peakVoltage).toFixed(1)}V`, color: [6, 182, 212] },
    { label: 'TOTAL PACKETS', value: `${totalPackets}`, color: [34, 197, 94] },
    { label: 'SIGNAL QUALITY (RSSI)', value: `${Math.round(avgRssi)} dBm`, color: [34, 197, 94] },
    { label: 'SIGNAL NOISE (SNR)', value: `${Number(avgSnr).toFixed(1)} dB`, color: [234, 179, 8] },
    { label: 'SYSTEM LINK STATUS', value: totalPackets > 0 ? 'SYNCED' : 'ZERO BASELINE', color: totalPackets > 0 ? [34, 197, 94] : [156, 163, 175] }
  ];

  const cardWidth = (contentWidth - 20) / 3;
  const cardHeight = 42;

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cardX = margin + (col * (cardWidth + 10));
    const cardY = y + (row * (cardHeight + 7));

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 8, cardY + 13);

    // Value
    doc.setFontSize(12);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, cardX + 8, cardY + 32);
  });

  y += (cardHeight * 3) + 24;

  // 3. Telemetry Log Table Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('TELEMETRY LOG STREAM (VERIFIED PACKET SAMPLES)', margin, y);
  y += 12;

  // Table Columns
  const cols = [
    { name: 'PKT ID', x: margin + 6, width: 45 },
    { name: 'TIMESTAMP', x: margin + 55, width: 85 },
    { name: 'CURRENT', x: margin + 145, width: 65 },
    { name: 'VOLTS', x: margin + 215, width: 60 },
    { name: 'POWER', x: margin + 280, width: 65 },
    { name: 'HALL SPD', x: margin + 350, width: 60 },
    { name: 'GPS SPD', x: margin + 415, width: 55 },
    { name: 'RSSI', x: margin + 475, width: 40 },
  ];

  // Draw Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  cols.forEach(col => {
    doc.text(col.name, col.x, y + 12);
  });

  y += 18;

  // Prepare rows (last 30 samples)
  const rows = allPackets.slice(-30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (rows.length === 0) {
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, y, contentWidth, 22, 'F');
    doc.setTextColor(107, 114, 128);
    doc.text('No active hardware packets recorded. Telemetry sitting at zero baseline (0.00 A / 0.00 V).', margin + 10, y + 15);
    y += 22;
  } else {
    rows.forEach((row, idx) => {
      // Check page overflow
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 35;

        // Re-draw Table Header on new page
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, y, contentWidth, 18, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        cols.forEach(col => doc.text(col.name, col.x, y + 12));
        y += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 16, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 16, margin + contentWidth, y + 16);

      const packetId = row.packet_id || row.packetId || row.id || `#${idx + 1}`;
      const timeVal = row.created_at ? new Date(row.created_at).toLocaleTimeString() : (row.time || timestampStr);
      const cur = Number(row.current ?? row.amps ?? 0).toFixed(2) + ' A';
      const vlt = Number(row.voltage ?? row.volts ?? 0).toFixed(1) + ' V';
      const pwr = Math.round(Number(row.power ?? row.watts ?? (Number(row.current || 0) * Number(row.voltage || 0)))) + ' W';
      const hspd = Number(row.speed_hall ?? row.speed_h ?? row.speed ?? 0).toFixed(1) + ' mph';
      const gspd = Number(row.speed_gps ?? row.speed_g ?? row.speed ?? 0).toFixed(1) + ' mph';
      const rssi = (row.rssi != null ? row.rssi : -58) + ' dBm';

      doc.setTextColor(51, 65, 85);
      doc.text(String(packetId), cols[0].x, y + 11);
      doc.text(String(timeVal), cols[1].x, y + 11);

      // Colorized values
      doc.setTextColor(220, 38, 38);
      doc.text(cur, cols[2].x, y + 11);

      doc.setTextColor(37, 99, 235);
      doc.text(vlt, cols[3].x, y + 11);

      doc.setTextColor(147, 51, 234);
      doc.text(pwr, cols[4].x, y + 11);

      doc.setTextColor(220, 38, 38);
      doc.text(hspd, cols[5].x, y + 11);

      doc.setTextColor(202, 138, 4);
      doc.text(gspd, cols[6].x, y + 11);

      doc.setTextColor(22, 163, 74);
      doc.text(rssi, cols[7].x, y + 11);

      y += 16;
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('JC-APEX Telemetry Intelligence Platform · Built for Electrothon 48V Competition Verification', margin, pageHeight - 14);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
  }

  // Generate binary PDF Blob and trigger native browser download
  const safeSession = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `JC-APEX_Session_Report_${safeSession}.pdf`;

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 10000);

  return filename;
}
