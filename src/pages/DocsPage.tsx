import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DocsPage - Redirects to the documentation portal
 * 
 * The documentation is served from /docs/index.html
 * This component handles the /docs route
 */
export default function DocsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the docs index page
    window.location.href = '/docs/index.html';
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Loading Documentation...</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting you to the KoreShield documentation portal.
        </p>
      </div>
    </div>
  );
}
