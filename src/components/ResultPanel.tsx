'use client';

import { ProcessingSession } from '@/types';

interface ResultPanelProps {
  session: ProcessingSession;
}

export default function ResultPanel({ session }: ResultPanelProps) {
  const completedSteps = session.steps.filter(s => s.status === 'completed').length;
  const totalSteps = session.steps.length;

  if (completedSteps === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm">処理結果が表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 overflow-y-auto p-4 space-y-6">
      {/* Session Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-gray-900 mb-2">処理セッション</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">セッションID:</span>
            <p className="font-mono text-xs text-gray-800">{session.id}</p>
          </div>
          <div>
            <span className="text-gray-600">ステータス:</span>
            <p className="capitalize">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                session.status === 'completed' ? 'bg-green-100 text-green-800' :
                session.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                session.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {session.status === 'completed' ? '完了' :
                 session.status === 'processing' ? '処理中' :
                 session.status === 'uploading' ? 'アップロード中' :
                 session.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Files Overview */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-semibold text-gray-900 mb-3">アップロード済みファイル</h4>
        {session.files.length > 0 ? (
          <div className="space-y-2">
            {session.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-600">{file.pages} ページ</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {file.candidates.length} 物件候補 | {file.images?.length || 0} 画像
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">ファイル解析中...</p>
          </div>
        )}
      </div>

      {/* Detected Properties */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-semibold text-gray-900 mb-3">検出された物件</h4>
        {session.listings.length > 0 ? (
          <div className="space-y-4">
            {session.listings.map((listing, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg">
                        {listing.物件名?.value || `物件 ${index + 1}`}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {listing.所在地?.value || '住所抽出中...'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {listing.賃料?.value ? `¥${listing.賃料.value.toLocaleString()}` : '賃料抽出中'}
                      </div>
                      <div className="text-sm text-gray-500">
                        間取り: {listing.間取り?.value || '抽出中'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">専有面積</span>
                      <p className="font-medium">
                        {listing.専有面積?.value ? `${listing.専有面積.value}㎡` : '---'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">築年月</span>
                      <p className="font-medium">{listing.築年月?.value || '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">構造</span>
                      <p className="font-medium">{listing.構造?.value || '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">向き</span>
                      <p className="font-medium">{listing.向き?.value || '---'}</p>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h6 className="font-medium text-gray-900 mb-2">初期費用</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">敷金:</span>
                        <p className="font-medium">
                          {listing.敷金月数?.value !== undefined ? `${listing.敷金月数.value}ヶ月` : '---'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">礼金:</span>
                        <p className="font-medium">
                          {listing.礼金月数?.value !== undefined ? `${listing.礼金月数.value}ヶ月` : '---'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">管理費:</span>
                        <p className="font-medium">
                          {listing.管理費共益費?.value ? `¥${listing.管理費共益費.value.toLocaleString()}` : '---'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">契約形態:</span>
                        <p className="font-medium">{listing.契約形態?.value || '---'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Overview */}
                  <div>
                    <h6 className="font-medium text-gray-900 mb-2">抽出品質</h6>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(listing)
                        .filter(([_, field]) => field && field.confidence > 0)
                        .sort(([,a], [,b]) => b.confidence - a.confidence)
                        .slice(0, 8)
                        .map(([key, field]) => {
                          const confidence = field.confidence || 0;
                          return (
                            <span 
                              key={key}
                              className={`px-2 py-1 rounded-full text-xs border ${
                                confidence > 0.8 ? 'bg-green-50 text-green-700 border-green-200' :
                                confidence > 0.6 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                confidence > 0.4 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}
                              title={`根拠: ${field.evidence?.snippet || ''}`}
                            >
                              {key} {Math.round(confidence * 100)}%
                            </span>
                          );
                        })}
                    </div>
                  </div>

                  {/* Low confidence items */}
                  {Object.entries(listing).some(([_, field]) => field && field.confidence > 0 && field.confidence < 0.6) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h6 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        要確認項目
                      </h6>
                      <div className="space-y-1 text-sm">
                        {Object.entries(listing)
                          .filter(([_, field]) => field && field.confidence > 0 && field.confidence < 0.6)
                          .map(([key, field]) => (
                            <div key={key} className="text-yellow-800">
                              <span className="font-medium">{key}</span>: {String(field.value)} 
                              <span className="text-xs text-yellow-600 ml-2">
                                (信頼度 {Math.round(field.confidence * 100)}%)
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">物件情報を抽出中...</p>
            <div className="mt-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {session.files.some(file => file.images && file.images.length > 0) && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold text-gray-900 mb-3">抽出画像ギャラリー</h4>
          
          {session.files.map(file => {
            if (!file.images || file.images.length === 0) return null;
            
            // Group images by type
            const imagesByType = file.images.reduce((acc: any, img) => {
              if (!acc[img.type]) acc[img.type] = [];
              acc[img.type].push(img);
              return acc;
            }, {});

            const typeLabels: Record<string, string> = {
              floorplan: '🏗️ 間取り図',
              exterior: '🏢 外観',
              interior: '🛋️ 室内',
              bath: '🛁 浴室',
              kitchen: '🍳 キッチン',
              view: '🌅 眺望',
              map: '🗺️ 地図',
              logo: '🏢 ロゴ',
              other: '📄 その他'
            };

            return (
              <div key={file.id} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h5 className="font-medium text-gray-900">{file.name}</h5>
                  <span className="text-xs text-gray-500">
                    {file.images.length}枚の画像
                  </span>
                </div>

                {Object.entries(imagesByType).map(([type, images]: [string, any[]]) => (
                  <div key={type} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {typeLabels[type] || type}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {images.length}枚
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img 
                            src={image.url}
                            alt={`${type} ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => window.open(image.url, '_blank')}
                          />
                          
                          {/* Confidence indicator */}
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            image.confidence > 0.8 ? 'bg-green-500' :
                            image.confidence > 0.6 ? 'bg-yellow-500' :
                            image.confidence > 0.4 ? 'bg-orange-500' : 'bg-red-500'
                          }`} title={`信頼度: ${Math.round(image.confidence * 100)}%`}></div>
                          
                          {/* Page indicator */}
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                            P{image.pageIndex + 1}
                          </div>
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Image statistics */}
                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <h6 className="text-sm font-medium text-gray-900 mb-2">分類統計</h6>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(imagesByType).map(([type, images]: [string, any[]]) => {
                      const avgConfidence = images.reduce((sum, img) => sum + img.confidence, 0) / images.length;
                      return (
                        <span key={type} className="text-xs bg-white px-2 py-1 rounded border">
                          {typeLabels[type] || type}: {images.length}枚 
                          <span className="text-gray-500 ml-1">
                            ({Math.round(avgConfidence * 100)}%)
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final Results */}
      {session.status === 'completed' && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-semibold text-green-900">処理完了</h4>
          </div>

          {/* Show Notion integration results */}
          {(() => {
            const notionStep = session.steps.find(s => s.id === 'notion');
            const notionSuccessful = notionStep?.evidence?.includes('件のNotionページを作成');
            
            return (
              <div className="mb-4">
                <p className="text-sm text-green-800 mb-2">
                  {session.listings.length}件の物件情報を抽出しました
                </p>
                
                {notionStep && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      {notionSuccessful ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">Notion統合: 成功</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-yellow-800">Notion統合: 部分的</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {notionStep.evidence || 'Notion統合の詳細情報はありません'}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {(() => {
              const notionStep = session.steps.find(s => s.id === 'notion');
              const hasNotionPages = notionStep?.evidence?.includes('件のNotionページを作成');
              
              return (
                <>
                  <button 
                    onClick={() => {
                      if (hasNotionPages) {
                        // Try to open Notion workspace
                        window.open('https://notion.so', '_blank');
                      } else {
                        alert('Notionページの作成に失敗しました。ログを確認してください。');
                      }
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      hasNotionPages 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!hasNotionPages}
                  >
                    {hasNotionPages ? 'Notionで確認' : 'Notion統合失敗'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      alert('PDF出力機能は近日実装予定です');
                    }}
                    className="px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                  >
                    PDF出力
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}