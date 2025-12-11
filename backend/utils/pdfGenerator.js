const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Home = require('../models/Home');
const Reading = require('../models/Reading');
const Device = require('../models/Device');
const User = require('../models/User'); // Required for populate
const { calculateMonthlyCost } = require('./costCalculator');
const { compareToNeighborhood } = require('./comparisonEngine');
const { generateTips, calculatePotentialSavings } = require('./tipGenerator');

/**
 * PDF Generator - Create monthly report PDFs
 * Generates comprehensive energy reports with charts, insights, and recommendations
 */

/**
 * Generate monthly report PDF
 * @param {String} homeId - Home ID
 * @param {Number} year - Year
 * @param {Number} month - Month (1-12)
 * @param {String} outputPath - Path to save PDF (optional)
 * @returns {String} Path to generated PDF
 */
const generateMonthlyReport = async (homeId, year, month, outputPath = null) => {
    try {
        // Gather all data
        const home = await Home.findById(homeId).populate('user', 'name email');
        if (!home) {
            throw new Error('Home not found');
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get cost data
        const costData = await calculateMonthlyCost(homeId, year, month);

        // Get neighborhood comparison
        let comparisonData;
        try {
            comparisonData = await compareToNeighborhood(homeId, startDate, endDate);
        } catch (error) {
            console.error('Error getting neighborhood comparison:', error);
            comparisonData = null;
        }

        // Get tips
        const tips = await generateTips(homeId, startDate, endDate);
        const savings = calculatePotentialSavings(tips);

        // Get devices
        const devices = await Device.find({ home: homeId, isActive: true });

        // Set output path
        if (!outputPath) {
            const reportsDir = path.join(__dirname, '../uploads/reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            outputPath = path.join(
                reportsDir,
                `report_${homeId}_${year}_${month}_${Date.now()}.pdf`
            );
        }

        // Create PDF with buffering enabled for footer page numbers
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true
        });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add content
        addHeader(doc, home, year, month);
        addExecutiveSummary(doc, costData, comparisonData);
        addUsageBreakdown(doc, costData);
        addDeviceAnalysis(doc, costData.deviceBreakdown, devices);
        addDailyTrends(doc, costData.dailyBreakdown);

        if (comparisonData && comparisonData.comparison) {
            addNeighborhoodComparison(doc, comparisonData);
        }

        addSavingsTips(doc, tips.slice(0, 5), savings); // Top 5 tips
        addFooter(doc);

        // Finalize PDF
        doc.end();

        // Wait for stream to finish
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`PDF report generated: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error generating PDF report:', error);
        throw error;
    }
};

/**
 * Add header to PDF
 */
const addHeader = (doc, home, year, month) => {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Energy Usage Report', { align: 'center' })
        .moveDown(0.5);

    doc
        .fontSize(16)
        .font('Helvetica')
        .text(`${monthNames[month - 1]} ${year}`, { align: 'center' })
        .moveDown(0.5);

    doc
        .fontSize(12)
        .text(home.name, { align: 'center' })
        .text(`${home.address.street || ''} ${home.address.city || ''} ${home.address.state || ''}`.trim(), { align: 'center' })
        .moveDown(1);

    // Add line separator
    doc
        .strokeColor('#2563eb')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1);
};

/**
 * Add executive summary
 */
const addExecutiveSummary = (doc, costData, comparisonData) => {
    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Executive Summary')
        .moveDown(0.5);

    doc
        .fontSize(12)
        .font('Helvetica');

    // Safely get values with defaults
    const totalCost = costData?.totalCost || 0;
    const totalKWh = costData?.totalKWh || 0;
    const avgDailyCost = costData?.avgDailyCost || 0;
    const avgDailyKWh = costData?.avgDailyKWh || 0;

    // Cost summary box
    const boxY = doc.y;
    doc
        .rect(50, boxY, 250, 100)
        .fillAndStroke('#dbeafe', '#2563eb');

    doc
        .fillColor('#1f2937')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Total Energy Cost', 60, boxY + 15);

    doc
        .fontSize(28)
        .fillColor('#2563eb')
        .text(`₹${totalCost.toFixed(2)}`, 60, boxY + 40);

    doc
        .fontSize(10)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text(`${totalKWh.toFixed(2)} kWh used`, 60, boxY + 75);

    // Usage summary box
    doc
        .rect(310, boxY, 240, 100)
        .fillAndStroke('#fef3c7', '#f59e0b');

    doc
        .fillColor('#1f2937')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Daily Average', 320, boxY + 15);

    doc
        .fontSize(20)
        .fillColor('#f59e0b')
        .text(`₹${avgDailyCost.toFixed(2)}`, 320, boxY + 45);

    doc
        .fontSize(10)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text(`${avgDailyKWh.toFixed(2)} kWh/day`, 320, boxY + 75);

    doc.y = boxY + 120;
    doc.moveDown(0.5);

    // Comparison message
    if (comparisonData && comparisonData.comparison) {
        const comp = comparisonData.comparison;
        doc
            .fontSize(11)
            .fillColor('#374151')
            .font('Helvetica')
            .text(comp.message, { align: 'left' })
            .moveDown(1);
    }
};

/**
 * Add usage breakdown section
 */
const addUsageBreakdown = (doc, costData) => {
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Usage Breakdown')
        .moveDown(0.5);

    doc
        .fontSize(12)
        .font('Helvetica');

    const deviceBreakdown = costData?.deviceBreakdown || [];

    if (deviceBreakdown.length === 0) {
        doc
            .fontSize(11)
            .fillColor('#6b7280')
            .text('No usage data available for this period.', { align: 'left' })
            .moveDown(1);
        return;
    }

    const tableTop = doc.y;
    const tableHeaders = ['Category', 'Usage (kWh)', 'Cost', 'Percentage'];
    const colWidths = [200, 100, 100, 100];
    let xPos = 50;

    // Draw header
    doc.font('Helvetica-Bold').fontSize(10);
    tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i] });
        xPos += colWidths[i];
    });

    // Draw header line
    doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

    // Draw rows
    let yPos = tableTop + 25;
    doc.font('Helvetica').fontSize(10);

    // Group by category
    const categoryMap = {};
    deviceBreakdown.forEach(device => {
        const category = (device.deviceType || 'Other').replace(/_/g, ' ').toUpperCase();
        if (!categoryMap[category]) {
            categoryMap[category] = {
                totalKWh: 0,
                totalCost: 0,
                percentage: 0,
            };
        }
        categoryMap[category].totalKWh += device.totalKWh || 0;
        categoryMap[category].totalCost += device.totalCost || 0;
        categoryMap[category].percentage += device.percentage || 0;
    });

    Object.entries(categoryMap)
        .sort((a, b) => b[1].totalCost - a[1].totalCost)
        .slice(0, 8) // Top 8 categories
        .forEach(([category, data]) => {
            if (yPos > 700) {
                doc.addPage();
                yPos = 50;
            }

            xPos = 50;
            doc.text(category, xPos, yPos, { width: colWidths[0] });
            xPos += colWidths[0];
            doc.text(data.totalKWh.toFixed(2), xPos, yPos, { width: colWidths[1] });
            xPos += colWidths[1];
            doc.text(`₹${data.totalCost.toFixed(2)}`, xPos, yPos, { width: colWidths[2] });
            xPos += colWidths[2];
            doc.text(`${data.percentage.toFixed(1)}%`, xPos, yPos, { width: colWidths[3] });

            yPos += 20;
        });

    doc.y = yPos + 10;
    doc.moveDown(1);
};

/**
 * Add device analysis section
 */
const addDeviceAnalysis = (doc, deviceBreakdown, devices) => {
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Top Energy Consumers')
        .moveDown(0.5);

    doc.fontSize(12).font('Helvetica');

    const breakdown = deviceBreakdown || [];

    if (breakdown.length === 0) {
        doc
            .fontSize(11)
            .fillColor('#6b7280')
            .text('No device data available for this period.', { align: 'left' })
            .moveDown(1);
        return;
    }

    // Top 5 devices
    breakdown.slice(0, 5).forEach((device, index) => {
        if (doc.y > 700) {
            doc.addPage();
        }

        const deviceType = (device.deviceType || 'Unknown').replace(/_/g, ' ');
        const totalKWh = device.totalKWh || 0;
        const totalCost = device.totalCost || 0;
        const percentage = device.percentage || 0;

        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text(`${index + 1}. ${device.deviceName || 'Unknown Device'}`)
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#6b7280')
            .text(`Type: ${deviceType}`)
            .text(`Usage: ${totalKWh.toFixed(2)} kWh (${percentage.toFixed(1)}%)`)
            .text(`Cost: ₹${totalCost.toFixed(2)}`)
            .moveDown(0.5);

        // Draw bar
        const barWidth = Math.max((percentage / 100) * 400, 5);
        doc
            .rect(50, doc.y, barWidth, 15)
            .fillAndStroke('#3b82f6', '#2563eb');

        doc.y += 25;
    });

    doc.moveDown(1);
};

/**
 * Add daily trends section
 */
const addDailyTrends = (doc, dailyBreakdown) => {
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Daily Usage Trends')
        .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    const breakdown = dailyBreakdown || [];

    if (breakdown.length === 0) {
        doc
            .fontSize(11)
            .fillColor('#6b7280')
            .text('No daily data available for this period.', { align: 'left' })
            .moveDown(1);
        return;
    }

    // Simple text representation of trends
    const avgCost = breakdown.reduce((sum, d) => sum + (d.totalCost || 0), 0) / breakdown.length;
    const highUsageDays = breakdown.filter(d => (d.totalCost || 0) > avgCost * 1.2);
    const lowUsageDays = breakdown.filter(d => (d.totalCost || 0) < avgCost * 0.8);

    doc
        .text(`Average daily cost: ₹${avgCost.toFixed(2)}`)
        .text(`High usage days: ${highUsageDays.length}`)
        .text(`Low usage days: ${lowUsageDays.length}`)
        .moveDown(1);

    if (highUsageDays.length > 0) {
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Highest Usage Days:')
            .font('Helvetica')
            .fontSize(10);

        highUsageDays.slice(0, 3).forEach(day => {
            doc.text(`  • ${day.date}: ₹${(day.totalCost || 0).toFixed(2)} (${(day.totalKWh || 0).toFixed(2)} kWh)`);
        });
    }

    doc.moveDown(1);
};

/**
 * Add neighborhood comparison section
 */
const addNeighborhoodComparison = (doc, comparisonData) => {
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Neighborhood Comparison')
        .moveDown(0.5);

    const comp = comparisonData.comparison;

    doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Your Ranking: ${comp.ranking}`)
        .moveDown(0.5);

    const boxY = doc.y;

    // Your home box
    doc
        .rect(50, boxY, 240, 80)
        .fillAndStroke('#dbeafe', '#2563eb');

    doc
        .fillColor('#1f2937')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Your Home', 60, boxY + 10);

    doc
        .fontSize(20)
        .fillColor('#2563eb')
        .text(`${comparisonData.home.totalKWh.toFixed(0)} kWh`, 60, boxY + 35);

    doc
        .fontSize(10)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text(`₹${comparisonData.home.totalCost.toFixed(2)}`, 60, boxY + 60);

    // Neighborhood average box
    doc
        .rect(310, boxY, 240, 80)
        .fillAndStroke('#f3f4f6', '#9ca3af');

    doc
        .fillColor('#1f2937')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Neighborhood Avg', 320, boxY + 10);

    doc
        .fontSize(20)
        .fillColor('#6b7280')
        .text(`${comparisonData.neighborhood.avgKWh.toFixed(0)} kWh`, 320, boxY + 35);

    doc
        .fontSize(10)
        .fillColor('#9ca3af')
        .font('Helvetica')
        .text(`₹${comparisonData.neighborhood.avgCost.toFixed(2)}`, 320, boxY + 60);

    doc.y = boxY + 100;
    doc.moveDown(1);
};

/**
 * Add savings tips section
 */
const addSavingsTips = (doc, tips, savings) => {
    doc.addPage();

    doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Energy Savings Recommendations')
        .moveDown(0.5);

    doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#374151')
        .text(`Potential Monthly Savings: ₹${savings.monthly.min}-${savings.monthly.max}`)
        .moveDown(1);

    tips.forEach((tip, index) => {
        if (doc.y > 650) {
            doc.addPage();
        }

        // Priority badge
        const priorityColors = {
            high: { fill: '#fecaca', stroke: '#dc2626', text: '#991b1b' },
            medium: { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
            low: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
        };

        const colors = priorityColors[tip.priority];

        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text(`${index + 1}. ${tip.title}`)
            .moveDown(0.3);

        doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(tip.description)
            .moveDown(0.3);

        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#374151')
            .text('Recommendations:')
            .font('Helvetica')
            .fontSize(9);

        tip.recommendations.forEach(rec => {
            if (doc.y > 720) {
                doc.addPage();
            }
            doc.fillColor('#4b5563').text(`  • ${rec}`, { indent: 10 });
        });

        doc
            .fontSize(9)
            .fillColor('#059669')
            .font('Helvetica-Bold')
            .text(`Potential savings: ${tip.potentialSavings}`)
            .moveDown(0.8);
    });
};

/**
 * Add footer to PDF
 */
const addFooter = (doc) => {
    const pages = doc.bufferedPageRange();

    if (!pages || pages.count === 0) {
        return;
    }

    for (let i = pages.start; i < pages.start + pages.count; i++) {
        doc.switchToPage(i);

        doc
            .fontSize(8)
            .fillColor('#9ca3af')
            .text(
                `Generated on ${new Date().toLocaleDateString()} | Page ${i - pages.start + 1} of ${pages.count}`,
                50,
                doc.page.height - 50,
                { align: 'center', width: doc.page.width - 100 }
            );
    }
};

/**
 * Generate comparison report for multiple months
 * @param {String} homeId - Home ID
 * @param {Number} year - Year
 * @param {Array} months - Array of month numbers
 * @param {String} outputPath - Output path
 * @returns {String} Path to generated PDF
 */
const generateComparisonReport = async (homeId, year, months, outputPath = null) => {
    // Implementation for multi-month comparison report
    // This would create a comparative analysis across multiple months
    throw new Error('Not yet implemented');
};

module.exports = {
    generateMonthlyReport,
    generateComparisonReport,
};
