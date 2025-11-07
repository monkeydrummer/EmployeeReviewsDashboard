import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Review, Reviewee, CATEGORIES, RATING_DEFINITIONS, CAREER_DEV_QUESTION } from '../types';
import { getCategoryRatingTextWithLevel, formatOverallScore, formatPeriod } from '../utils';

// Create styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 70,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  letterheadHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 10,
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: '#ffffff',
  },
  letterheadLogo: {
    width: 150,
    marginBottom: 10,
    objectFit: 'contain',
  },
  letterheadDivider: {
    borderTop: '2 solid #f97316',
    marginTop: 5,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    backgroundColor: '#f0f0f0',
    padding: 6,
  },
  table: {
    width: '100%',
    marginBottom: 10,
    border: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    padding: 8,
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
  },
  col1: {
    width: '50%',
    borderRight: '1 solid #ddd',
  },
  col2: {
    width: '25%',
    borderRight: '1 solid #ddd',
  },
  col3: {
    width: '25%',
  },
  categoryName: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 2,
  },
  coreValue: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  commentsLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  commentsText: {
    fontSize: 8,
    color: '#333',
  },
  ratingText: {
    fontSize: 9,
    textAlign: 'center',
  },
  careerDevQuestion: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    marginBottom: 8,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#333',
  },
  careerDevResponse: {
    padding: 8,
    backgroundColor: '#fafafa',
    marginBottom: 8,
    fontSize: 9,
  },
  responseLabel: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  definitionsSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    border: '1 solid #ddd',
  },
  definitionItem: {
    marginBottom: 6,
  },
  definitionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  definitionText: {
    fontSize: 8,
    color: '#555',
  },
  letterheadFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 15,
    paddingLeft: 30,
    paddingRight: 30,
    borderTop: '2 solid #f97316', // Orange border
    backgroundColor: '#ffffff',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#666',
  },
  footerLeft: {
    flex: 1,
  },
  footerCenter: {
    flex: 1,
    textAlign: 'center',
  },
  footerRight: {
    flex: 1,
    textAlign: 'right',
  },
  pageNumber: {
    fontSize: 7,
    color: '#999',
  },
});

interface ReviewPDFProps {
  review: Review;
  reviewee: Reviewee;
  baseUrl?: string;
}

export const ReviewPDF: React.FC<ReviewPDFProps> = ({ review, reviewee, baseUrl = '' }) => {
  const logoUrl = baseUrl ? `${baseUrl}/images/rocscience-logo-Dark_1.jpg` : '/images/rocscience-logo-Dark_1.jpg';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead Header */}
        <View style={styles.letterheadHeader} fixed>
          <Image 
            src={logoUrl}
            style={styles.letterheadLogo}
          />
          <View style={styles.letterheadDivider} />
        </View>

        {/* Document Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Employee Performance Review</Text>
          <Text style={styles.subtitle}>Employee: {reviewee.name}</Text>
          <Text style={styles.subtitle}>Title: {reviewee.title}</Text>
          <Text style={styles.subtitle}>
            Review Period: {formatPeriod(review.period)} {review.year}
          </Text>
          <Text style={styles.subtitle}>Manager(s): {reviewee.managers.join(', ')}</Text>
          {review.completedDate && (
            <Text style={styles.subtitle}>
              Completed: {new Date(review.completedDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Category Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Assessments</Text>
          
          {CATEGORIES.map((category, index) => (
            <View key={category.id} style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, styles.col1]}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.coreValue}>Core Value: {category.coreValue}</Text>
                </View>
                <View style={[styles.tableCell, styles.col2]}>
                  <Text>Employee Rating</Text>
                </View>
                <View style={[styles.tableCell, styles.col3]}>
                  <Text>Manager Rating</Text>
                </View>
              </View>
              
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.col1]}>
                  <Text style={styles.commentsLabel}>Employee Comments:</Text>
                  <Text style={styles.commentsText}>
                    {review.employeeComments[category.id] || 'No comments provided'}
                  </Text>
                  <Text style={styles.commentsLabel}>Manager Comments:</Text>
                  <Text style={styles.commentsText}>
                    {review.managerComments[category.id] || 'No comments provided'}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.col2]}>
                  <Text style={styles.ratingText}>
                    {getCategoryRatingTextWithLevel(review.employeeCategoryRatings[category.id])}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.col3]}>
                  <Text style={styles.ratingText}>
                    {getCategoryRatingTextWithLevel(review.managerCategoryRatings[category.id])}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Overall Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCell, styles.col1]}>
                <Text>Overall Rating</Text>
              </View>
              <View style={[styles.tableCell, styles.col2]}>
                <Text>Employee Score</Text>
              </View>
              <View style={[styles.tableCell, styles.col3]}>
                <Text>Manager Score</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.col1]}>
                <Text>Numeric score (0-5)</Text>
              </View>
              <View style={[styles.tableCell, styles.col2]}>
                <Text style={styles.ratingText}>
                  {formatOverallScore(review.employeeOverallScore)}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.col3]}>
                <Text style={styles.ratingText}>
                  {formatOverallScore(review.managerOverallScore)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Career Development */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Development</Text>
          <View style={styles.careerDevQuestion}>
            <Text>{CAREER_DEV_QUESTION}</Text>
          </View>
          
          <View style={styles.careerDevResponse}>
            <Text style={styles.responseLabel}>Employee Response:</Text>
            <Text>{review.employeeCareerDev || 'No response provided'}</Text>
          </View>
          
          <View style={styles.careerDevResponse}>
            <Text style={styles.responseLabel}>Manager Response:</Text>
            <Text>{review.managerCareerDev || 'No response provided'}</Text>
          </View>
        </View>

        {/* Letterhead Footer */}
        <View style={styles.letterheadFooter} fixed>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerText}>{reviewee.name}</Text>
              <Text style={styles.footerText}>{formatPeriod(review.period)} {review.year}</Text>
            </View>
            <View style={styles.footerCenter}>
              <Text style={styles.footerText}>Confidential Document</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                `Page ${pageNumber} of ${totalPages}`
              )} />
            </View>
          </View>
        </View>
      </Page>

      {/* Rating Definitions - Second Page */}
      <Page size="A4" style={styles.page}>
        {/* Letterhead Header */}
        <View style={styles.letterheadHeader} fixed>
          <Image 
            src={logoUrl}
            style={styles.letterheadLogo}
          />
          <View style={styles.letterheadDivider} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Definitions</Text>
          <View style={styles.definitionsSection}>
            {RATING_DEFINITIONS.map((def) => (
              <View key={def.level} style={styles.definitionItem}>
                <Text style={styles.definitionTitle}>
                  {def.label} ({def.level})
                </Text>
                <Text style={styles.definitionText}>{def.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Letterhead Footer */}
        <View style={styles.letterheadFooter} fixed>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerText}>{reviewee.name}</Text>
              <Text style={styles.footerText}>{formatPeriod(review.period)} {review.year}</Text>
            </View>
            <View style={styles.footerCenter}>
              <Text style={styles.footerText}>Confidential Document</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                `Page ${pageNumber} of ${totalPages}`
              )} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

