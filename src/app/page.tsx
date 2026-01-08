import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          物件PDF抽出ツール
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          PDFファイルをアップロードするだけで、AIが物件情報を自動抽出。
          物確作業をスムーズに進められます。
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">使い方</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">PDFアップロード</h3>
              <p className="text-gray-600">マイソクのPDFファイルを選択してアップロード</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">AI解析</h3>
              <p className="text-gray-600">AIが物件情報を自動で抽出・整理</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">物確作業</h3>
              <p className="text-gray-600">抽出された情報で物確作業をスタート</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link 
            href="/simple"
            className="inline-block bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            PDFを抽出する
          </Link>
          
          <div className="text-sm text-gray-500">
            対応ファイル形式: PDF | 複数ファイル対応
          </div>
        </div>

        <div className="mt-16 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">抽出される情報</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
            <div>• 物件名</div>
            <div>• 所在地</div>
            <div>• 賃料</div>
            <div>• 間取り</div>
            <div>• 専有面積</div>
            <div>• 最寄り駅</div>
            <div>• 築年月</div>
            <div>• 管理費</div>
            <div>• 敷金・礼金</div>
            <div>• 連絡先</div>
            <div>• その他詳細情報</div>
            <div>• ...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

