// Quick test to debug upload API
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    // Create a simple test PDF-like file
    const testContent = Buffer.from('Test PDF content');
    
    const form = new FormData();
    form.append('files', testContent, {
      filename: 'test.pdf',
      contentType: 'application/pdf'
    });

    console.log('Sending upload request...');
    
    const response = await fetch('https://mysouk-ai-extractor.vercel.app/api/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const text = await response.text();
    console.log('Response text:', text);

    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        console.log('Response JSON:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Failed to parse as JSON');
      }
    }

  } catch (error) {
    console.error('Upload test failed:', error.message);
    console.error('Error details:', error);
  }
}

testUpload();