import { Download, Users } from 'lucide-react';
import Modal from '../Modal';
import useFetch from '../../hooks/useFetch';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatTimestamp, formatDate } from '../../utils/format';
import { ErrorState, Spinner } from '../States';
import SeatMeter from '../SeatMeter';

/** Builds a CSV in the browser so the admin can download the attendee list. */
function downloadCsv(event, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['Name', 'Email', 'Registered at (UTC)'].map(escape).join(','),
    ...rows.map((r) => [r.student_name, r.student_email, r.registration_date].map(escape).join(',')),
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-attendees.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AttendeeList({ event }) {
  const { data, loading, error, refetch } = useFetch(() => adminService.registrations(event.id), [event.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-violet">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const rows = data.registrations;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-56 flex-1">
          <SeatMeter capacity={data.event.capacity} available={data.event.available_seats} />
        </div>
        {rows.length > 0 && (
          <button type="button" className="btn-secondary" onClick={() => downloadCsv(event, rows)}>
            <Download className="h-4 w-4" aria-hidden /> Download CSV
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-xl bg-mist px-6 py-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted" aria-hidden />
          <p className="mt-2 font-semibold">No students have registered yet</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-mist text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">#</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Student</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-muted tabular-nums">{rows.length - i}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.student_name}</p>
                    <p className="text-muted">{r.student_email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatTimestamp(r.registration_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AttendeesModal({ event, onClose }) {
  return (
    <Modal
      open={Boolean(event)}
      onClose={onClose}
      size="lg"
      title={event ? `Registered students` : ''}
      description={event ? `${event.title} — ${formatDate(event.date)}` : ''}
    >
      {event && <AttendeeList event={event} />}
    </Modal>
  );
}
