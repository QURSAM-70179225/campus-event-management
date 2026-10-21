import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../Modal';
import FormField from '../FormField';
import { Spinner } from '../States';
import { CATEGORIES } from '../../utils/categories';
import { validateEventForm } from '../../utils/validation';
import { eventService } from '../../services/eventService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import useToast from '../../hooks/useToast';

const EMPTY = {
  title: '',
  description: '',
  date: '',
  time: '10:00',
  location: '',
  category: '',
  capacity: '50',
  image_url: '',
};

/** Create (event = null) or edit an event. Calls onSaved(event) on success. */
export default function EventFormModal({ open, event, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(event);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError('');
    setValues(
      event
        ? {
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            category: event.category,
            capacity: String(event.capacity),
            image_url: event.image_url || '',
          }
        : EMPTY
    );
  }, [open, event]);

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateEventForm(values);
    if (editing && Number(values.capacity) < event.registered_count) {
      found.capacity = `${event.registered_count} students are already registered, so capacity must be at least ${event.registered_count}.`;
    }
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = { ...values, capacity: Number(values.capacity), image_url: values.image_url.trim() };
    setSaving(true);
    try {
      const res = editing ? await eventService.update(event.id, payload) : await eventService.create(payload);
      toast.success(res.message);
      onSaved(res.event);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not save the event.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      size="lg"
      title={editing ? 'Edit event' : 'Create a new event'}
      description={editing ? `Changes are visible to students immediately.` : 'Students can register as soon as it is created.'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Discard
          </button>
          <button type="submit" form="event-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />}
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
          </button>
        </>
      }
    >
      <form id="event-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {formError}
          </div>
        )}
        <FormField className="sm:col-span-2" label="Title" name="title" value={values.title} onChange={onChange} error={errors.title} placeholder="e.g. Cloud Computing Workshop" />
        <FormField
          className="sm:col-span-2"
          as="textarea"
          label="Description"
          name="description"
          rows={5}
          value={values.description}
          onChange={onChange}
          error={errors.description}
          placeholder="What will students do or learn? Who is it for?"
        />
        <FormField label="Date" name="date" type="date" value={values.date} onChange={onChange} error={errors.date} />
        <FormField label="Start time" name="time" type="time" value={values.time} onChange={onChange} error={errors.time} />
        <FormField className="sm:col-span-2" label="Venue" name="location" value={values.location} onChange={onChange} error={errors.location} placeholder="e.g. Main Auditorium, Main Campus" />
        <FormField label="Category" error={errors.category}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              name="category"
              value={values.category}
              onChange={onChange}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={`input ${invalid ? 'input-error' : ''}`}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField
          label="Capacity"
          name="capacity"
          type="number"
          min={editing ? Math.max(1, event.registered_count) : 1}
          step={1}
          value={values.capacity}
          onChange={onChange}
          error={errors.capacity}
          hint={editing ? `${event.registered_count} seats already taken` : 'Maximum number of students'}
        />
        <FormField
          className="sm:col-span-2"
          label="Image URL (optional)"
          name="image_url"
          type="url"
          value={values.image_url}
          onChange={onChange}
          error={errors.image_url}
          placeholder="https://…"
          hint="Leave empty to use the category artwork."
        />
      </form>
    </Modal>
  );
}
