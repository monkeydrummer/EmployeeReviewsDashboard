import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, getRevieweesList, getManagersList } from '@/lib/storage';
import { verifyAdminPassword } from '@/lib/auth';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReviewPDF } from '@/lib/pdf/ReviewPDF';
import { createElement } from 'react';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, period, year, status } = body;

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all reviews, reviewees, and managers
    const reviews = await getAllReviews();
    const revieweesList = await getRevieweesList();
    const managersList = await getManagersList();

    // Filter reviews based on criteria
    let filteredReviews = reviews;
    if (period) {
      filteredReviews = filteredReviews.filter(r => r.period === period);
    }
    if (year) {
      filteredReviews = filteredReviews.filter(r => r.year === year);
    }
    if (status) {
      filteredReviews = filteredReviews.filter(r => r.status === status);
    }

    if (filteredReviews.length === 0) {
      return NextResponse.json(
        { error: 'No reviews found matching the criteria' },
        { status: 404 }
      );
    }

    // Create ZIP file
    const zip = new JSZip();

    // Generate PDF for each review
    for (const review of filteredReviews) {
      const reviewee = revieweesList.reviewees.find(r => r.id === review.revieweeId);
      if (!reviewee) continue;

      try {
        // Get manager names
        const managerNames = reviewee.managerIds
          .map(id => managersList.managers.find(m => m.id === id)?.name)
          .filter(Boolean)
          .join(', ');

        const revieweeWithManagers = { ...reviewee, managers: [managerNames] };
        const pdfElement = createElement(ReviewPDF, { review, reviewee: revieweeWithManagers });
        const pdfBuffer = await renderToBuffer(pdfElement);
        const fileName = `${reviewee.name.replace(/\s+/g, '-')}-${review.period}-${review.year}.pdf`;
        zip.file(fileName, pdfBuffer);
      } catch (error) {
        console.error(`Error generating PDF for review ${review.id}:`, error);
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Return ZIP as downloadable file
    const zipFileName = `Reviews-${period || 'All'}-${year || 'All'}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}

