import React from 'react';

export const validatePassword = (password = '') => {
  const checks = {
    length: password.length >= 8 && password.length <= 14,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\\/[\]~`]/.test(password),
  };

  const isValid = checks.length && checks.hasUpper && checks.hasLower && checks.hasSpecial;
  return { isValid, checks };
};

const PasswordRequirementsModal = ({ isOpen, onClose, checks = {} }) => {
  if (!isOpen) return null;

  const requirements = [
    {
      id: 'length',
      label: 'Length between 8 and 14 characters',
      passed: Boolean(checks.length),
    },
    {
      id: 'hasUpper',
      label: 'Minimum one capital letter (A–Z)',
      passed: Boolean(checks.hasUpper),
    },
    {
      id: 'hasLower',
      label: 'Minimum one small letter (a–z)',
      passed: Boolean(checks.hasLower),
    },
    {
      id: 'hasSpecial',
      label: 'Minimum one special symbol (!@#$%^&*...)',
      passed: Boolean(checks.hasSpecial),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-saffron-100 space-y-4 animate-scaleIn">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Password Requirements
              </h3>
              <p className="text-xs text-gray-500">
                Please satisfy all criteria to register:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg p-1 rounded-full leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Checklist */}
        <div className="bg-saffron-50/50 p-4 rounded-2xl border border-saffron-100 space-y-2.5 text-xs">
          {requirements.map((req) => (
            <div key={req.id} className="flex items-center gap-2.5">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  req.passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {req.passed ? '✓' : '✕'}
              </span>
              <span
                className={`font-semibold ${
                  req.passed ? 'text-gray-800' : 'text-red-700'
                }`}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          Got it, I'll update
        </button>
      </div>
    </div>
  );
};

export default PasswordRequirementsModal;
