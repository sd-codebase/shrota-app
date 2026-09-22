import { Result } from 'antd';
import { useAuth } from '../context/AuthContext';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

/**
 * Blocks Publisher accounts from pages outside their scope (books + read-only
 * reference data), even if they navigate to the URL directly rather than
 * clicking a (hidden) sidebar link.
 */
export default function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { isFullAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isFullAdmin) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, publisher accounts don't have access to this page."
      />
    );
  }

  return <>{children}</>;
}
