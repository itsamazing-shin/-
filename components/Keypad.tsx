import React from 'react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSearch: () => void;
  disabled?: boolean;
}

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onClear, onBackspace, onSearch, disabled }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto select-none">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKeyPress(k)}
          disabled={disabled}
          className="h-14 bg-white rounded-lg shadow-sm text-2xl font-semibold text-gray-700 active:bg-gray-100 focus:outline-none transition-colors border border-gray-200"
        >
          {k}
        </button>
      ))}
      <button
        onClick={onClear}
        disabled={disabled}
        className="h-14 bg-rose-50 rounded-lg shadow-sm text-lg font-semibold text-rose-600 active:bg-rose-100 border border-rose-100"
      >
        전체삭제
      </button>
      <button
        onClick={() => onKeyPress('0')}
        disabled={disabled}
        className="h-14 bg-white rounded-lg shadow-sm text-2xl font-semibold text-gray-700 active:bg-gray-100 border border-gray-200"
      >
        0
      </button>
      <button
        onClick={onBackspace}
        disabled={disabled}
        className="h-14 bg-gray-50 rounded-lg shadow-sm text-lg font-semibold text-gray-600 active:bg-gray-100 border border-gray-200 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
        </svg>
      </button>

      <button
        onClick={onSearch}
        disabled={disabled}
        className="col-span-3 h-16 mt-2 bg-slate-800 rounded-xl shadow-md text-white text-xl font-bold tracking-wide active:bg-slate-900 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        검색 (입차확인)
      </button>
    </div>
  );
};

export default Keypad;