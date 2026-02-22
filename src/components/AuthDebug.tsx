import { useEffect, useState } from 'react';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState({
    hasToken: false,
    tokenPreview: '',
    hasRefreshToken: false,
    hasUser: false,
    user: null as any,
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userStr = localStorage.getItem('user');
      
      setDebugInfo({
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'No token',
        hasRefreshToken: !!refreshToken,
        hasUser: !!userStr,
        user: userStr ? JSON.parse(userStr) : null,
      });
    };

    updateDebugInfo();
    
    // Update every second to catch changes
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50 font-mono">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      <div className="space-y-1">
        <div className={debugInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
          Token: {debugInfo.hasToken ? '✓' : '✗'}
        </div>
        {debugInfo.hasToken && (
          <div className="text-gray-400 text-[10px] break-all">
            {debugInfo.tokenPreview}
          </div>
        )}
        <div className={debugInfo.hasRefreshToken ? 'text-green-400' : 'text-red-400'}>
          Refresh: {debugInfo.hasRefreshToken ? '✓' : '✗'}
        </div>
        <div className={debugInfo.hasUser ? 'text-green-400' : 'text-red-400'}>
          User: {debugInfo.hasUser ? '✓' : '✗'}
        </div>
        {debugInfo.user && (
          <div className="text-gray-400 mt-2">
            <div>Name: {debugInfo.user.full_name}</div>
            <div>Type: {debugInfo.user.user_type}</div>
            <div>Phone: {debugInfo.user.phone_number}</div>
          </div>
        )}
      </div>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        className="mt-3 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs w-full"
      >
        Clear & Reload
      </button>
    </div>
  );
}
