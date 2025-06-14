
import React from 'react';
import { getPasswordStrength } from '../../contexts/auth/authValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  show: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  show 
}) => {
  if (!show || !password) return null;

  const { strength, score, feedback } = getPasswordStrength(password);

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-orange-500';
      case 'good': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(score / 6) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${
          strength === 'weak' ? 'text-red-600' :
          strength === 'fair' ? 'text-orange-600' :
          strength === 'good' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      
      {feedback.length > 0 && (
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">To improve your password:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
