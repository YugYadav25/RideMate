import { jsPDF } from 'jspdf';

export type RideTicketDetails = {
  invoiceNumber: string;
  generatedOn: string;
  passengerName: string;
  driverName: string;
  rideDate: string;
  rideTime: string;
  seats: string;
  vehicleDetails: string;
  startLabel: string;
  destinationLabel: string;
  distanceKm: number;
  durationMinutes: number;
  fareBreakdown: string;
  totalFare: number;
  addons?: {
    firstAid: boolean;
    doorToDoor: boolean;
  };
  fellowRiders?: Array<{ name: string; rating?: string | number }>;
};

const addSectionHeading = (doc: jsPDF, text: string, x: number, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(text, x, y);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
};

export const generateRideTicketPDF = (details: RideTicketDetails) => {
  const doc = new jsPDF();

  doc.setCharSpace(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('RideMate Invoice/Ticket', 105, 20, { align: 'center' });
  doc.line(15, 24, 195, 24);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Number: ${details.invoiceNumber}`, 20, 34);
  doc.text(`Generated on: ${details.generatedOn}`, 20, 42);

  addSectionHeading(doc, 'Ride Summary:', 20, 58);
  let currentY = 66;

  const summaryLines = [
    `Passenger: ${details.passengerName}`,
    `Driver: ${details.driverName}`,
    `Ride Date: ${details.rideDate}`,
    `Ride Time: ${details.rideTime}`,
    `Seats: ${details.seats}`,
    `Vehicle Details: ${details.vehicleDetails}`,
    `Start: ${details.startLabel}`,
    `Destination: ${details.destinationLabel}`,
    `Distance: ${details.distanceKm} km`,
    `Estimated Time: ${details.durationMinutes} mins`,
  ];

  summaryLines.forEach((line) => {
    doc.text(line, 22, currentY);
    currentY += 8;
  });

  currentY += 4;
  addSectionHeading(doc, 'Fellow Riders:', 20, currentY);
  currentY += 8;

  if (details.fellowRiders && details.fellowRiders.length > 0) {
    details.fellowRiders.forEach((rider, index) => {
      const ratingText =
        rider.rating !== undefined ? `Rating: ${rider.rating}` : 'Rating: N/A';
      doc.text(`Seat ${index + 1}: ${rider.name} (${ratingText})`, 22, currentY);
      currentY += 7;
    });
  } else {
    doc.text('No fellow riders listed.', 22, currentY);
    currentY += 7;
  }

  currentY += 6;
  addSectionHeading(doc, 'Payment Details:', 20, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setCharSpace(0);
  doc.setLineHeightFactor(1.2);

  const fareBreakdownLine = `Fare Breakdown: Distance (${details.distanceKm.toFixed(2)} km) × Rs 10/km = Rs ${(details.distanceKm * 10).toFixed(2)}`;
  doc.text(fareBreakdownLine, 22, currentY);
  currentY += 8;

  if (details.addons) {
    if (details.addons.firstAid) {
      doc.text('Add-on: First Aid Kit (+ Rs 15)', 22, currentY);
      currentY += 8;
    }
    if (details.addons.doorToDoor) {
      doc.text('Add-on: Door-to-Door Service (+ Rs 25)', 22, currentY);
      currentY += 8;
    }
  }

  const totalFareLine = `Total Fare: Rs ${details.totalFare.toFixed(2)}`;
  doc.text(totalFareLine, 22, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setCharSpace(0);
  doc.setLineHeightFactor(1.2);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.text('Thank you for using RideMate for your journey', pageWidth / 2, pageHeight - 15, {
    align: 'center',
  });

  doc.save(`RideMate-Ticket-${details.invoiceNumber}.pdf`);
};

