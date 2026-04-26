import { Navigate } from 'react-router-dom';

export default function ApiKeyManagementPage() {
	return <Navigate to="/settings/api-keys" replace />;
}
