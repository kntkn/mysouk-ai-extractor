'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DropzoneProps } from '@/types';

export default function FileDropzone({ onFilesSelected, disabled }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter for PDF files only
      const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length !== acceptedFiles.length) {
        alert('PDFファイルのみアップロード可能です');
      }
      
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    disabled,
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Dynamic styling based on drag state
  const getDropzoneStyle = () => {
    if (disabled) return 'border-gray-200 bg-gray-50 cursor-not-allowed';
    if (isDragReject) return 'border-red-300 bg-red-50';
    if (isDragAccept) return 'border-green-300 bg-green-50';
    if (isDragActive) return 'border-blue-400 bg-blue-50';
    return 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50';
  };

  const getIconColor = () => {
    if (disabled) return 'text-gray-400';
    if (isDragReject) return 'text-red-500';
    if (isDragAccept) return 'text-green-500';
    if (isDragActive) return 'text-blue-500';
    return 'text-gray-400';
  };

  const getMessage = () => {
    if (disabled) return 'アップロード無効';
    if (isDragReject) return 'PDFファイルのみ対応';
    if (isDragAccept) return 'ファイルをドロップしてください';
    if (isDragActive) return 'ファイルをここにドロップ';
    return 'PDFファイルをドラッグ&ドロップまたはクリックして選択';
  };

  return (
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer transition-all duration-200 ease-in-out
        border-2 border-dashed rounded-xl p-12 text-center
        ${getDropzoneStyle()}
      `}
    >
      <input {...getInputProps()} />
      
      {/* Upload Icon */}
      <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center ${getIconColor()}`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      {/* Main Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {getMessage()}
      </h3>
      
      {/* Sub Message */}
      <p className="text-sm text-gray-600 mb-6">
        最大10ファイル、1ファイルあたり50MBまで
      </p>

      {/* File Types */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span className="px-2 py-1 bg-gray-100 rounded-full">PDF</span>
        <span>対応形式</span>
      </div>

      {/* Processing indicator */}
      {disabled && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">処理中...</span>
          </div>
        </div>
      )}
    </div>
  );
}