import { useState } from 'react';

const TestAuth = () => {
  const [result, setResult] = useState('');

  const testLogin = async () => {
    setResult('Отправка запроса...');
    
    try {
      const url = 'https://functions.poehali.dev/2a65d178-004e-4fc0-bca2-100aa5710b02';
      console.log('Sending request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: 'testuser',
          password: 'test123'
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error('Error:', error);
      setResult('Ошибка: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'monospace' }}>
      <h1>Test Auth Page</h1>
      <button 
        onClick={testLogin}
        style={{
          padding: '20px 40px',
          fontSize: '18px',
          cursor: 'pointer',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Test Login
      </button>
      <pre style={{ marginTop: '20px', background: '#f5f5f5', padding: '20px' }}>
        {result || 'Нажмите кнопку для теста'}
      </pre>
    </div>
  );
};

export default TestAuth;
