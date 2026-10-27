import { Navigate, useParams } from 'react-router-dom';
import { CATEGORIES } from '@/lib/rate-profiles/constants';

// Only /admin/pricing/freight and /admin/pricing/origin exist.
export default function CategoryGuard({ children }) {
  const { category } = useParams();
  return CATEGORIES[category] ? children : <Navigate to="/admin/pricing/freight" replace />;
}
