import { NextRequest, NextResponse } from 'next/server';
import { getReview, getRevieweesList } from '@/lib/storage';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReviewPDF } from '@/lib/pdf/ReviewPDF';
import { createElement } from 'react';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await getReview(params.id);
    const revieweesList = await getRevieweesList();
    const reviewee = revieweesList.reviewees.find(r => r.id === review.revieweeId);

    if (!reviewee) {
      return NextResponse.json({ error: 'Reviewee not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfElement = createElement(ReviewPDF, { review, reviewee });
    const pdfBuffer = await renderToBuffer(pdfElement);

    // Return PDF as downloadable file
    const fileName = `${reviewee.name.replace(/\s+/g, '-')}-${review.period}-${review.year}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

