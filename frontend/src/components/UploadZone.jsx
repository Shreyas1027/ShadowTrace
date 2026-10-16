import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

export default function UploadZone({ onFileSelected, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (onFileSelected) {
        onFileSelected(file);
      }
    }
  }, [disabled, onFileSelected]);

  const handleInputChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onFileSelected) {
        onFileSelected(file);
      }
      // Reset input value so re-uploading the same file still fires onChange
      e.target.value = '';
    }
  }, [onFileSelected]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Upload JPEG photo for metadata analysis"
      className={`group relative flex flex-col items-center justify-center rounded-2xl p-8 text-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
        isDragging
          ? 'border-2 border-dashed border-amber-400 bg-amber-50/70 scale-[0.99]'
          : 'border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 bg-slate-50/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition duration-200 ${
        isDragging
          ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-100/50'
          : 'bg-white text-slate-500 shadow-sm border border-slate-100 group-hover:text-amber-600 group-hover:scale-105'
      }`}>
        <UploadCloud className="h-7 w-7" />
      </div>

      <p className="text-base font-semibold text-slate-800">
        Drop your image here, or{' '}
        <span className="text-amber-600 underline underline-offset-4 decoration-amber-300 group-hover:decoration-amber-500">
          browse
        </span>
      </p>

      <p className="mt-1.5 text-xs text-slate-500 font-medium">
        Supports JPEG (.jpg, .jpeg) up to 10 MB
      </p>
    </div>
  );
}
