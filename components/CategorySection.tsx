'use client';

import { Category, CategoryRating } from '@/lib/types';
import CategoryRatingSelect from './CategoryRatingSelect';
import { getCategoryRatingColor, getCategoryRatingText } from '@/lib/utils';

interface CategorySectionProps {
  category: Category;
  employeeRating: CategoryRating;
  managerRating: CategoryRating;
  employeeComment: string;
  managerComment: string;
  onEmployeeRatingChange: (rating: CategoryRating) => void;
  onManagerRatingChange: (rating: CategoryRating) => void;
  onEmployeeCommentChange: (comment: string) => void;
  onManagerCommentChange: (comment: string) => void;
  mode: 'employee' | 'manager' | 'view';
}

export default function CategorySection({
  category,
  employeeRating,
  managerRating,
  employeeComment,
  managerComment,
  onEmployeeRatingChange,
  onManagerRatingChange,
  onEmployeeCommentChange,
  onManagerCommentChange,
  mode,
}: CategorySectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Category Header */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Core Value: <span className="font-medium text-blue-600">{category.coreValue}</span>
        </p>
      </div>

      {/* Employee Section */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Employee Self-Assessment</h4>
        
        {mode === 'employee' ? (
          <>
            <CategoryRatingSelect
              value={employeeRating}
              onChange={onEmployeeRatingChange}
              label="Your Rating"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comments
              </label>
              <textarea
                value={employeeComment}
                onChange={(e) => onEmployeeCommentChange(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add your comments..."
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-sm font-medium text-gray-700">Rating: </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryRatingColor(employeeRating)}`}>
                {getCategoryRatingText(employeeRating)}
              </span>
            </div>
            {employeeComment && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{employeeComment}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Manager Section */}
      {(mode === 'manager' || mode === 'view') && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-800">Manager Assessment</h4>
          
          {mode === 'manager' ? (
            <>
              <CategoryRatingSelect
                value={managerRating}
                onChange={onManagerRatingChange}
                label="Manager Rating"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Comments
                </label>
                <textarea
                  value={managerComment}
                  onChange={(e) => onManagerCommentChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add your comments..."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-sm font-medium text-gray-700">Rating: </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryRatingColor(managerRating)}`}>
                  {getCategoryRatingText(managerRating)}
                </span>
              </div>
              {managerComment && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{managerComment}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

