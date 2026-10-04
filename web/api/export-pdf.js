/**
 * Vercel Serverless Function for PDF Export
 * Endpoint: /api/export-pdf?sessionId=xyz
 *
 * Generates a PDF report for a telemetry session using pdfkit
 * - Session metadata
 * - Aggregated metrics (peak current, averages, duration)
 * - Signal quality metrics (RSSI, SNR)
 * - Downloadable PDF document
 */

const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId parameter is required' });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch session metrics
    const { data: metrics, error: metricsError } = await supabase
      .rpc('calculate_session_metrics', { session_id_param: sessionId });

    if (metricsError) {
      throw new Error(`Failed to fetch session metrics: ${metricsError.message}`);
    }

    if (!metrics || metrics.length === 0) {
      return res.status(404).json({ error: 'Session not found or no data available' });
    }

    const sessionMetrics = metrics[0];

    // Fetch all telemetry data for the session
    const { data: telemetryData, error: telemetryError } = await supabase
      .from('telemetry_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (telemetryError) {
      throw new Error(`Failed to fetch telemetry data: ${telemetryError.message}`);
    }

    // Generate PDF
    const pdfBuffer = await generateSessionReport(sessionId, sessionMetrics, telemetryData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="telemetry_session_${sessionId}.pdf"`);
    res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer));

    return res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('PDF export error:', error);
    return res.status(500).json({ error: error.message });
  }
};

function generateSessionReport(sessionId, metrics, telemetryData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF chunks
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Helper function for adding section headers
      const addSectionHeader = (text) => {
        doc.rect(50, doc.y - 5, 500, 20).fillAndStroke('#e5e7eb', '#e5e7eb');
        doc.fillColor('#1f2937').fontSize(14).font('Helvetica-Bold').text(text, 60, doc.y + 5);
        doc.moveDown(2);
      };

      // Helper function for adding metric rows
      const addMetricRow = (label, value, unit = '') => {
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text(label, 60, doc.y);
        doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(`${value} ${unit}`, 500, doc.y, { align: 'right' });
        doc.moveDown(1.5);
      };

      // Title header
      doc.rect(0, 0, 612, 80).fill('#ef4444');
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('TELEMETRY SESSION REPORT', 306, 45, { align: 'center' });
      doc.moveDown(3);

      // Session Information
      addSectionHeader('SESSION INFORMATION');
      addMetricRow('Session ID', sessionId);
      addMetricRow('Total Records', metrics.total_records);
      addMetricRow('Duration', formatDuration(metrics.duration_seconds), 'seconds');
      doc.moveDown(1);

      // Current Metrics
      addSectionHeader('CURRENT METRICS');
      addMetricRow('Peak Current', metrics.peak_current?.toFixed(2), 'A');
      addMetricRow('Average Current', metrics.avg_current?.toFixed(2), 'A');
      addMetricRow('Minimum Current', metrics.min_current?.toFixed(2), 'A');
      doc.moveDown(1);

      // Signal Quality
      addSectionHeader('SIGNAL QUALITY');
      addMetricRow('Average RSSI', metrics.avg_rssi?.toFixed(1), 'dBm');
      addMetricRow('Average SNR', metrics.avg_snr?.toFixed(1), 'dB');
      doc.moveDown(1);

      // Sample Data Summary (last 50 points)
      if (telemetryData && telemetryData.length > 0) {
        addSectionHeader('SAMPLE TELEMETRY DATA (Last 50 Points)');

        // Table header
        doc.rect(50, doc.y - 5, 500, 20).fillAndStroke('#f3f4f6', '#f3f4f6');
        doc.fillColor('#1f2937').fontSize(9).font('Helvetica-Bold');
        doc.text('Packet ID', 60, doc.y + 5);
        doc.text('Current (A)', 150, doc.y + 5);
        doc.text('RSSI (dBm)', 250, doc.y + 5);
        doc.text('SNR (dB)', 350, doc.y + 5);
        doc.text('Timestamp', 450, doc.y + 5);
        doc.moveDown(1.5);

        // Table rows (last 50)
        const sampleData = telemetryData.slice(-50);
        doc.font('Helvetica').fontSize(8).fillColor('#374151');
        sampleData.forEach((row, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          doc.rect(50, doc.y - 5, 500, 15).fill(bgColor);
          doc.fillColor('#374151');
          doc.text(row.packet_id.toString(), 60, doc.y);
          doc.text(row.current?.toFixed(2) || 'N/A', 150, doc.y);
          doc.text(row.rssi?.toString() || 'N/A', 250, doc.y);
          doc.text(row.snr?.toFixed(1) || 'N/A', 350, doc.y);
          doc.text(new Date(row.created_at).toLocaleTimeString(), 450, doc.y);
          doc.moveDown(1);
        });
      }

      // Footer on all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#9ca3af').text(
          `Generated by JC APEX Telemetry System | Page ${i + 1} of ${range.count}`,
          306,
          780,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatDuration(seconds) {
  if (!seconds) return '0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}
