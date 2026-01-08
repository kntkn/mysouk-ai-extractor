'use client';

import { useState, useCallback } from 'react';

interface PropertyInfo {
  物件名?: string;
  所在地?: string;
  賃料?: number;
  間取り?: string;
  専有面積?: number;
  最寄り駅?: string;
  築年月?: string;
  管理費?: number;
  敷金?: string;
  礼金?: string;
  連絡先?: string;
}

interface ExtractionResult {
  success: boolean;
  property?: PropertyInfo;
  error?: string;
}

export default function SimplePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setResult(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      alert('PDFファイルを選択してください');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // アップロード
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('ファイルアップロードに失敗しました');
      }

      const uploadData = await uploadResponse.json();
      const sessionId = uploadData.sessionId;

      // 抽出
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          files: uploadData.files,
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('物件情報の抽出に失敗しました');
      }

      const extractData = await extractResponse.json();
      
      if (extractData.success && extractData.listings && extractData.listings.length > 0) {
        const listing = extractData.listings[0];
        const property: PropertyInfo = {
          物件名: listing.物件名?.value,
          所在地: listing.所在地?.value,
          賃料: listing.賃料?.value,
          間取り: listing.間取り?.value,
          専有面積: listing.専有面積?.value,
          最寄り駅: listing.最寄り駅1?.value || listing.最寄り駅?.value,
          築年月: listing.築年月?.value,
          管理費: listing.管理費共益費?.value || listing.管理費?.value,
          敷金: listing.敷金月数?.value ? `${listing.敷金月数.value}月` : listing.敷金?.value,
          礼金: listing.礼金月数?.value ? `${listing.礼金月数.value}月` : listing.礼金?.value,
          連絡先: listing.業者電話番号?.value || listing.連絡先?.value,
        };

        setResult({
          success: true,
          property,
        });
      } else {
        throw new Error('物件情報を抽出できませんでした');
      }

    } catch (error) {
      console.error('処理エラー:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '情報なし';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            物件PDF抽出ツール
          </h1>
          
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                PDFファイルを選択
              </label>
              {files && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    選択されたファイル: {Array.from(files).map(f => f.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 text-center">
              <button
                type="submit"
                disabled={!files || isProcessing}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? '処理中...' : '物件情報を抽出'}
              </button>
            </div>
          </form>

          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">PDFを解析中...</p>
            </div>
          )}

          {result && (
            <div className="mt-8">
              {result.success && result.property ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-green-800 mb-4">✅ 抽出完了</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: '物件名', key: '物件名' as keyof PropertyInfo },
                      { label: '所在地', key: '所在地' as keyof PropertyInfo },
                      { label: '賃料', key: '賃料' as keyof PropertyInfo, suffix: '円' },
                      { label: '間取り', key: '間取り' as keyof PropertyInfo },
                      { label: '専有面積', key: '専有面積' as keyof PropertyInfo, suffix: '㎡' },
                      { label: '最寄り駅', key: '最寄り駅' as keyof PropertyInfo },
                      { label: '築年月', key: '築年月' as keyof PropertyInfo },
                      { label: '管理費', key: '管理費' as keyof PropertyInfo, suffix: '円' },
                      { label: '敷金', key: '敷金' as keyof PropertyInfo },
                      { label: '礼金', key: '礼金' as keyof PropertyInfo },
                      { label: '連絡先', key: '連絡先' as keyof PropertyInfo },
                    ].map(({ label, key, suffix }) => (
                      <div key={key} className="bg-white p-3 rounded border">
                        <dt className="text-sm font-medium text-gray-500">{label}</dt>
                        <dd className="text-base text-gray-900">
                          {formatValue(result.property![key])}{suffix && result.property![key] !== undefined && result.property![key] !== null ? suffix : ''}
                        </dd>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      この情報で物確作業を進めてください
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                    >
                      新しいPDFを処理
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-red-800 mb-2">❌ エラー</h2>
                  <p className="text-red-600">{result.error}</p>
                  <button
                    onClick={() => setResult(null)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200"
                  >
                    再試行
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}