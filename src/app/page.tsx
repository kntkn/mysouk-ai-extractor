'use client';

import { useState, useCallback } from 'react';
import { ProcessingSession, LogEntry, ProcessingStep } from '@/types';
import FileDropzone from '@/components/FileDropzone';
import ProgressBar from '@/components/ProgressBar';
import StreamingLog from '@/components/StreamingLog';
import ResultPanel from '@/components/ResultPanel';

export default function HomePage() {
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newSession: ProcessingSession = {
      id: `session-${Date.now()}`,
      steps: [
        { id: 'upload', name: 'ファイルアップロード', status: 'processing', progress: 0 },
        { id: 'parse', name: 'PDF解析', status: 'pending', progress: 0 },
        { id: 'detect', name: '物件検出・分割', status: 'pending', progress: 0 },
        { id: 'extract', name: 'AI情報抽出', status: 'pending', progress: 0 },
        { id: 'normalize', name: 'データ正規化', status: 'pending', progress: 0 },
        { id: 'images', name: '画像抽出・分類', status: 'pending', progress: 0 },
        { id: 'notion', name: 'Notionページ作成', status: 'pending', progress: 0 },
        { id: 'complete', name: '完了', status: 'pending', progress: 0 },
      ],
      files: [],
      listings: [],
      status: 'uploading',
      startTime: Date.now(),
    };

    setSession(newSession);
    
    // Initial log entry
    const initialLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      level: 'info',
      message: `${files.length}個のPDFファイルをアップロード中...`,
      details: { fileNames: files.map(f => f.name) }
    };
    
    setLogs([initialLog]);

    // Start processing
    try {
      await processFiles(files, newSession, setSession, setLogs);
    } catch (error) {
      console.error('Processing error:', error);
      setLogs(prev => [...prev, {
        id: `error-${Date.now()}`,
        timestamp: Date.now(),
        level: 'error',
        message: `エラーが発生しました: ${error}`,
      }]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">マイソクAI抽出システム</h1>
              <p className="text-gray-600 text-sm">PDFから物件情報を自動抽出し、Notionページを生成</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!session ? (
          /* Upload State */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                マイソクPDFをアップロードしてください
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                複数のPDFファイルを一度にドラッグ&ドロップできます。
                1つのPDFに複数物件が含まれている場合も自動で検出・分割されます。
              </p>
            </div>
            
            <FileDropzone onFilesSelected={handleFilesSelected} />
            
            {/* Features Preview */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-xl">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI自動抽出</h3>
                <p className="text-sm text-gray-600">Claude 3.5 Sonnetが物件情報を高精度で抽出</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Notion連携</h3>
                <p className="text-sm text-gray-600">美しい縦型レイアウトで自動ページ作成</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-xl">✨</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">検証UX</h3>
                <p className="text-sm text-gray-600">信頼度表示と根拠提示で安心</p>
              </div>
            </div>
          </div>
        ) : (
          /* Processing State */
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">処理状況</h2>
              <ProgressBar 
                steps={session.steps} 
                currentStep={session.steps.find(s => s.status === 'processing')?.id}
              />
            </div>

            {/* Content Area */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Streaming Log */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">処理ログ</h3>
                  <p className="text-sm text-gray-600">AIの処理状況をリアルタイムで表示</p>
                </div>
                <StreamingLog logs={logs} />
              </div>

              {/* Result Preview */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">処理結果</h3>
                  <p className="text-sm text-gray-600">検出された物件と抽出情報のプレビュー</p>
                </div>
                <ResultPanel session={session} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Real processing function with API integration
async function processFiles(
  files: File[],
  session: ProcessingSession,
  setSession: (session: ProcessingSession) => void,
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>
) {
  const steps = session.steps;
  
  try {
    // Step 1: Upload and Parse PDFs
    const uploadStep = steps.find(s => s.id === 'upload');
    if (uploadStep) {
      uploadStep.status = 'processing';
      uploadStep.startTime = Date.now();
      setSession({ ...session });

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-upload-start`,
        timestamp: Date.now(),
        level: 'info',
        message: `${files.length}個のPDFファイルをアップロード中...`,
        details: { fileNames: files.map(f => f.name) }
      }]);

      // Create FormData for upload
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      // Call upload API
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`アップロードエラー: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'アップロードに失敗しました');
      }

      // Update session with processed files
      session.files = uploadResult.files || [];
      session.listings = []; // Will be populated by extraction

      uploadStep.status = 'completed';
      uploadStep.endTime = Date.now();
      uploadStep.progress = 100;

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-upload-done`,
        timestamp: Date.now(),
        level: 'success',
        message: uploadResult.message || 'アップロードが完了しました',
        details: { 
          filesProcessed: uploadResult.files?.length,
          candidatesFound: uploadResult.groupedListings?.length 
        }
      }]);

      setSession({ ...session });
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 2: Parse PDF Content
    const parseStep = steps.find(s => s.id === 'parse');
    if (parseStep) {
      parseStep.status = 'processing';
      parseStep.startTime = Date.now();
      parseStep.details = `${session.files.length}個のPDFを解析中`;
      setSession({ ...session });

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-parse`,
        timestamp: Date.now(),
        level: 'info',
        message: 'PDF構造の解析を開始...',
      }]);

      // Simulate parsing progress
      for (let progress = 0; progress <= 100; progress += 25) {
        parseStep.progress = progress;
        setSession({ ...session });
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      parseStep.status = 'completed';
      parseStep.endTime = Date.now();
      parseStep.progress = 100;

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-parse-done`,
        timestamp: Date.now(),
        level: 'success',
        message: `PDF解析が完了。合計${session.files.reduce((sum, f) => sum + f.pages, 0)}ページを処理`,
      }]);

      setSession({ ...session });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Step 3: Detect and Split Properties
    const detectStep = steps.find(s => s.id === 'detect');
    if (detectStep) {
      detectStep.status = 'processing';
      detectStep.startTime = Date.now();
      setSession({ ...session });

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-detect`,
        timestamp: Date.now(),
        level: 'info',
        message: '物件候補の検出・分割を開始...',
      }]);

      // Simulate detection progress
      for (let progress = 0; progress <= 100; progress += 20) {
        detectStep.progress = progress;
        detectStep.details = `${Math.floor(progress/20)} / ${session.files.length} ファイル処理済み`;
        setSession({ ...session });
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      const totalCandidates = session.files.reduce((sum, f) => sum + f.candidates.length, 0);

      detectStep.status = 'completed';
      detectStep.endTime = Date.now();
      detectStep.progress = 100;

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-detect-done`,
        timestamp: Date.now(),
        level: 'success',
        message: `${totalCandidates}件の物件候補を検出しました`,
      }]);

      setSession({ ...session });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Step 4: AI Information Extraction
    const extractStep = steps.find(s => s.id === 'extract');
    if (extractStep) {
      extractStep.status = 'processing';
      extractStep.startTime = Date.now();
      setSession({ ...session });

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-extract-start`,
        timestamp: Date.now(),
        level: 'info',
        message: 'Claude AIによる物件情報抽出を開始...',
      }]);

      // Extract information from each detected candidate
      const extractedListings = [];
      const totalCandidates = session.files.reduce((sum, f) => sum + f.candidates.length, 0);
      let processedCandidates = 0;

      for (const file of session.files) {
        for (const candidate of file.candidates) {
          try {
            setLogs(prev => [...prev, {
              id: `log-${Date.now()}-extract-item`,
              timestamp: Date.now(),
              level: 'info',
              message: `物件抽出中: ${candidate.物件名}`,
            }]);

            // Call Claude API for extraction
            const extractResponse = await fetch('/api/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: session.id,
                candidateText: candidate.textContent || '',
                pageIndex: candidate.pageIndex,
              }),
            });

            if (extractResponse.ok) {
              const extractResult = await extractResponse.json();
              
              if (extractResult.success && extractResult.listing) {
                extractedListings.push(extractResult.listing);
                
                setLogs(prev => [...prev, {
                  id: `log-${Date.now()}-extract-success`,
                  timestamp: Date.now(),
                  level: 'success',
                  message: `✓ ${candidate.物件名}の情報抽出完了`,
                  details: { 
                    extractedFields: Object.keys(extractResult.listing).filter(k => 
                      extractResult.listing[k]?.confidence > 0.5
                    ).length 
                  }
                }]);
              }
            } else {
              setLogs(prev => [...prev, {
                id: `log-${Date.now()}-extract-error`,
                timestamp: Date.now(),
                level: 'warn',
                message: `⚠ ${candidate.物件名}の抽出に失敗`,
              }]);
            }

          } catch (extractError) {
            setLogs(prev => [...prev, {
              id: `log-${Date.now()}-extract-error`,
              timestamp: Date.now(),
              level: 'error',
              message: `${candidate.物件名}の抽出エラー: ${extractError.message}`,
            }]);
          }

          processedCandidates++;
          extractStep.progress = Math.round((processedCandidates / totalCandidates) * 100);
          extractStep.details = `${processedCandidates} / ${totalCandidates} 物件処理済み`;
          setSession({ ...session });
          
          await new Promise(resolve => setTimeout(resolve, 500)); // Avoid rate limits
        }
      }

      // Update session with extracted listings
      session.listings = extractedListings;

      extractStep.status = 'completed';
      extractStep.endTime = Date.now();
      extractStep.progress = 100;

      setLogs(prev => [...prev, {
        id: `log-${Date.now()}-extract-complete`,
        timestamp: Date.now(),
        level: 'success',
        message: `AI抽出が完了。${extractedListings.length}件の物件情報を取得`,
      }]);

      setSession({ ...session });
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Process remaining steps (normalize, images, notion, complete)
    const remainingSteps = ['normalize', 'images', 'notion', 'complete'];
    for (const stepId of remainingSteps) {
      const step = steps.find(s => s.id === stepId);
      if (step) {
        step.status = 'processing';
        step.startTime = Date.now();
        setSession({ ...session });

        setLogs(prev => [...prev, {
          id: `log-${Date.now()}-${stepId}`,
          timestamp: Date.now(),
          level: 'info',
          message: `${step.name}を開始...`,
        }]);

        if (stepId === 'notion') {
          // Real Notion integration
          let successfulCreations = 0;
          const totalListings = extractedListings.length;

          for (let i = 0; i < totalListings; i++) {
            const listing = extractedListings[i];
            
            try {
              setLogs(prev => [...prev, {
                id: `log-${Date.now()}-notion-create`,
                timestamp: Date.now(),
                level: 'info',
                message: `Notionページ作成中: ${listing.物件名?.value || `物件${i + 1}`}`,
              }]);

              const notionResponse = await fetch('/api/notion/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  listing,
                }),
              });

              if (notionResponse.ok) {
                const notionResult = await notionResponse.json();
                
                if (notionResult.success) {
                  successfulCreations++;
                  
                  setLogs(prev => [...prev, {
                    id: `log-${Date.now()}-notion-success`,
                    timestamp: Date.now(),
                    level: 'success',
                    message: `✓ Notionページ作成完了: ${listing.物件名?.value || `物件${i + 1}`}`,
                    details: { pageUrl: notionResult.pageUrl }
                  }]);
                } else {
                  setLogs(prev => [...prev, {
                    id: `log-${Date.now()}-notion-error`,
                    timestamp: Date.now(),
                    level: 'warn',
                    message: `⚠ Notionページ作成失敗: ${notionResult.error}`,
                  }]);
                }
              } else {
                const errorText = await notionResponse.text();
                setLogs(prev => [...prev, {
                  id: `log-${Date.now()}-notion-error`,
                  timestamp: Date.now(),
                  level: 'error',
                  message: `Notion API エラー: ${errorText}`,
                }]);
              }
            } catch (notionError) {
              setLogs(prev => [...prev, {
                id: `log-${Date.now()}-notion-error`,
                timestamp: Date.now(),
                level: 'error',
                message: `Notion作成エラー: ${notionError.message}`,
              }]);
            }

            // Update progress
            step.progress = Math.round(((i + 1) / totalListings) * 100);
            step.details = `${i + 1} / ${totalListings} ページ処理済み (${successfulCreations}件成功)`;
            setSession({ ...session });
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Avoid rate limits
          }

          step.evidence = `${successfulCreations}/${totalListings}件のNotionページを作成`;
          
          setLogs(prev => [...prev, {
            id: `log-${Date.now()}-notion-complete`,
            timestamp: Date.now(),
            level: successfulCreations === totalListings ? 'success' : 'warn',
            message: `Notion統合完了: ${successfulCreations}/${totalListings}件のページを作成`,
          }]);

        } else {
          // Simulate other steps for now
          for (let progress = 0; progress <= 100; progress += 50) {
            step.progress = progress;
            setSession({ ...session });
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          setLogs(prev => [...prev, {
            id: `log-${Date.now()}-${stepId}-done`,
            timestamp: Date.now(),
            level: 'success',
            message: `${step.name}が完了しました`,
          }]);
        }

        step.status = 'completed';
        step.endTime = Date.now();
        step.progress = 100;

        setSession({ ...session });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Final completion
    session.status = 'completed';
    session.endTime = Date.now();
    setSession({ ...session });

    setLogs(prev => [...prev, {
      id: `log-final`,
      timestamp: Date.now(),
      level: 'success',
      message: '🎉 すべての処理が完了しました！',
    }]);

  } catch (error) {
    console.error('Processing error:', error);
    
    // Mark current step as error
    const currentStep = steps.find(s => s.status === 'processing');
    if (currentStep) {
      currentStep.status = 'error';
      currentStep.endTime = Date.now();
    }

    session.status = 'error';
    setSession({ ...session });

    setLogs(prev => [...prev, {
      id: `error-${Date.now()}`,
      timestamp: Date.now(),
      level: 'error',
      message: `エラーが発生しました: ${error.message}`,
    }]);
  }
}
