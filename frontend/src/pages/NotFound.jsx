import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { EmptyState } from '../components/States';

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={MapPinOff}
        title="This page doesn't exist"
        message="The link may be broken or the page may have moved."
        action={
          <div className="flex gap-3">
            <Link to="/" className="btn-secondary">Go home</Link>
            <Link to="/events" className="btn-primary">Browse events</Link>
          </div>
        }
      />
    </div>
  );
}
