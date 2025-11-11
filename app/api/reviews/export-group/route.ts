import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, getRevieweesList, getManagersList } from '@/lib/storage';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReviewPDF } from '@/lib/pdf/ReviewPDF';
import { createElement } from 'react';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { managerEmail, period, year } = body;

    if (!managerEmail) {
      return NextResponse.json({ error: 'Manager email required' }, { status: 400 });
    }

    // Get all data
    const reviews = await getAllReviews();
    const revieweesList = await getRevieweesList();
    const managersList = await getManagersList();

    // Find the manager
    const manager = managersList.managers.find(m => m.email === managerEmail);
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Get reviewees managed by this manager
    const managedReviewees = revieweesList.reviewees.filter(r => 
      r.managerIds.includes(manager.id)
    );
    const managedRevieweeIds = new Set(managedReviewees.map(r => r.id));

    // Filter reviews for this manager's team and the specified period/year
    let filteredReviews = reviews.filter(r => managedRevieweeIds.has(r.revieweeId));
    
    if (period) {
      filteredReviews = filteredReviews.filter(r => r.period === period);
    }
    if (year) {
      filteredReviews = filteredReviews.filter(r => r.year === year);
    }

    if (filteredReviews.length === 0) {
      return NextResponse.json(
        { error: 'No reviews found for this period' },
        { status: 404 }
      );
    }

    // Get base URL from request
    const baseUrl = request.url ? new URL(request.url).origin : '';

    // Create ZIP file
    const zip = new JSZip();

    // Generate PDF for each review
    for (const review of filteredReviews) {
      const reviewee = managedReviewees.find(r => r.id === review.revieweeId);
      if (!reviewee) continue;

      try {
        // Get manager names
        const managerNames = reviewee.managerIds
          .map(id => managersList.managers.find(m => m.id === id)?.name)
          .filter(Boolean)
          .join(', ');

        const revieweeWithManagers = { ...reviewee, managers: [managerNames] };
        const pdfElement = createElement(ReviewPDF, { 
          review, 
          reviewee: revieweeWithManagers,
          baseUrl 
        });
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
    const zipFileName = `Reviews-${period}-${year}.zip`;

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

