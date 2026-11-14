import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Minus,
  Plus,
  Star,
  Wrench,
} from 'lucide-react';
import { listServices } from '../api/services';
import { createBooking } from '../api/bookings';
import { getMe } from '../api/auth';
import { addAddress } from '../api/users';
import { useToast } from '../components/Toast';
import { PageHeader, LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { StatusBadge } from '../components/StatusBadge';
import { getErrorMessage } from '../lib/api';
import {
  formatCurrency,
  formatDateTime,
  shortId,
  toDateTimeLocal,
} from '../lib/format';
import type { Booking } from '../types';

interface AddressForm {
  label: 'home' | 'work' | 'other';
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const emptyAddress: AddressForm = {
  label: 'home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'IN',
  isDefault: false,
};

export function CreateBookingPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const servicesQuery = useQuery({
    queryKey: ['services', 'booking-options'],
    queryFn: async () =>
      (await listServices({ includeInactive: false, page: 1, limit: 100 })).data,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await getMe()).data.user,
  });

  const services = servicesQuery.data ?? [];
  const addresses = meQuery.data?.addresses ?? [];

  const [serviceId, setServiceId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingDate, setBookingDate] = useState(() =>
    toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  );
  const [success, setSuccess] = useState<Booking | null>(null);
  const [formError, setFormError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });

  useEffect(() => {
    if (!serviceId && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (!addressId && addresses.length > 0) {
      const preferred = addresses.find((address) => address.isDefault) ?? addresses[0];
      setAddressId(preferred.id);
    }
  }, [addressId, addresses]);

  useEffect(() => {
    if (meQuery.isSuccess && addresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [meQuery.isSuccess, addresses.length]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services],
  );

  const total = (selectedService?.price ?? 0) * quantity;
  const parsedDate = bookingDate ? new Date(bookingDate) : null;
  const scheduledLabel =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? formatDateTime(parsedDate.toISOString())
      : '—';

  const addressMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: (response) => {
      const updatedUser = response.data.user;
      queryClient.setQueryData(['me'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      const newest = updatedUser.addresses?.[updatedUser.addresses.length - 1];
      if (newest) setAddressId(newest.id);
      setAddressForm({ ...emptyAddress });
      setShowAddressForm(false);
      toast.push('Address added.');
    },
    onError: (error) => toast.push(getErrorMessage(error), 'error'),
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (response) => {
      setSuccess(response.data);
      setFormError('');
      toast.push('Booking created successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFormError(message);
      toast.push(message, 'error');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!selectedService) {
      setFormError('Choose a service to continue.');
      return;
    }
    if (!addressId) {
      setFormError('Choose a service address to continue.');
      return;
    }
    const date = new Date(bookingDate);
    if (Number.isNaN(date.getTime())) {
      setFormError('Choose a valid date and time.');
      return;
    }

    bookingMutation.mutate({
      serviceId: selectedService.id,
      addressId,
      bookingDate: date.toISOString(),
      quantity,
    });
  };

  const submitAddress = () => {
    if (addressMutation.isPending) return;
    if (
      !addressForm.line1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      toast.push('Address line 1, city, state and pincode are required.', 'error');
      return;
    }
    addressMutation.mutate({
      ...addressForm,
      line1: addressForm.line1.trim(),
      line2: addressForm.line2.trim() || undefined,
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
    });
  };

  const handleAddressSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitAddress();
  };

  const isLoading = servicesQuery.isLoading || meQuery.isLoading;
  const loadError = servicesQuery.error || meQuery.error;

  return (
    <>
      <PageHeader
        title="Create booking"
        subtitle="Schedule a service on behalf of the signed-in account."
        actions={
          <Link to="/bookings" className="button button-secondary">
            Back to bookings
          </Link>
        }
      />

      {success && (
        <div className="success-banner">
          <span className="success-banner-icon">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <strong>Booking {shortId(success.id)} confirmed in the system.</strong>
            <span>
              {success.serviceSnapshot.name} · {formatDateTime(success.bookingDate)} ·{' '}
              {formatCurrency(success.totalAmount)}
            </span>
          </div>
          <div className="success-banner-actions">
            <StatusBadge status={success.status} />
            <Link to="/bookings" className="button button-primary button-sm">
              View bookings
            </Link>
            <button
              type="button"
              className="button button-ghost button-sm"
              onClick={() => setSuccess(null)}
            >
              Create another
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Preparing booking form…" />
      ) : loadError ? (
        <ErrorState
          message={getErrorMessage(loadError)}
          onRetry={() => {
            servicesQuery.refetch();
            meQuery.refetch();
          }}
        />
      ) : services.length === 0 ? (
        <EmptyState
          title="No active services"
          description="Add at least one active service before creating a booking."
          action={
            <Link to="/services" className="button button-primary button-sm">
              <Wrench size={15} /> Manage services
            </Link>
          }
        />
      ) : (
        <form className="create-booking-grid" onSubmit={handleSubmit}>
          <div className="stack">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Service</h2>
                  <p>Pick the service you want to book.</p>
                </div>
              </div>

              <label className="field">
                <span>Service</span>
                <select
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {formatCurrency(service.price)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedService && (
                <div className="service-preview">
                  <div className="service-preview-head">
                    <strong>{selectedService.name}</strong>
                    <span className="rating-pill">
                      <Star size={13} /> {selectedService.avgRating.toFixed(1)}
                    </span>
                  </div>
                  <p>{selectedService.description}</p>
                  <div className="service-preview-meta">
                    <span>
                      <Clock size={14} /> {selectedService.durationMins} mins
                    </span>
                    <span>{formatCurrency(selectedService.price)}</span>
                    <span>{selectedService.reviewCount} reviews</span>
                  </div>
                </div>
              )}

              <div className="form-grid">
                <label className="field">
                  <span>Quantity</span>
                  <div className="quantity-control">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.min(
                            99,
                            Math.max(1, Number(event.target.value) || 1),
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                      disabled={quantity >= 99}
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Date & time</span>
                  <input
                    type="datetime-local"
                    value={bookingDate}
                    min={toDateTimeLocal(new Date())}
                    onChange={(event) => setBookingDate(event.target.value)}
                    required
                  />
                </label>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Service address</h2>
                  <p>Bookings use one of the signed-in account&apos;s saved addresses.</p>
                </div>
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  onClick={() => setShowAddressForm((current) => !current)}
                >
                  <Plus size={15} />
                  {showAddressForm ? 'Hide form' : 'Add address'}
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="inline-alert">
                  <strong>No saved addresses yet.</strong>
                  <span>Add an address below to create your first booking.</span>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`address-card ${
                        addressId === address.id ? 'is-selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={addressId === address.id}
                        onChange={() => setAddressId(address.id)}
                      />
                      <span className="address-icon">
                        <MapPin size={16} />
                      </span>
                      <span className="address-body">
                        <span className="address-title">
                          {address.label}
                          {address.isDefault && (
                            <em className="default-tag">Default</em>
                          )}
                        </span>
                        <span>
                          {[
                            address.line1,
                            address.line2,
                            address.city,
                            address.state,
                            address.pincode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {showAddressForm && (
                <div
                  className="sub-form"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitAddress();
                    }
                  }}
                >
                  <h3>New address</h3>
                  <div className="form-grid">
                    <label className="field">
                      <span>Label</span>
                      <select
                        value={addressForm.label}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            label: event.target.value as 'home' | 'work' | 'other',
                          }))
                        }
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Address line 1</span>
                      <input
                        value={addressForm.line1}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            line1: event.target.value,
                          }))
                        }
                        placeholder="Flat / House no., street"
                      />
                    </label>
                    <label className="field">
                      <span>Address line 2</span>
                      <input
                        value={addressForm.line2}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            line2: event.target.value,
                          }))
                        }
                        placeholder="Area, landmark (optional)"
                      />
                    </label>
                    <label className="field">
                      <span>City</span>
                      <input
                        value={addressForm.city}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>State</span>
                      <input
                        value={addressForm.state}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            state: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Pincode</span>
                      <input
                        value={addressForm.pincode}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            pincode: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          isDefault: event.target.checked,
                        }))
                      }
                    />
                    Set as default address
                  </label>
                  <div className="sub-form-actions">
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      onClick={handleAddressSubmit}
                      disabled={addressMutation.isPending}
                    >
                      {addressMutation.isPending && <Spinner size={14} />}
                      Save address
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="card booking-summary">
            <div className="card-header">
              <div>
                <h2>Summary</h2>
                <p>Review before creating the booking.</p>
              </div>
            </div>
            <dl className="summary-list">
              <div>
                <dt>Service</dt>
                <dd>{selectedService?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Date & time</dt>
                <dd>{scheduledLabel}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{quantity}</dd>
              </div>
              <div>
                <dt>Unit price</dt>
                <dd>{formatCurrency(selectedService?.price ?? 0)}</dd>
              </div>
            </dl>
            <div className="summary-total">
              <span>Total payable</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}
            <button
              type="submit"
              className="button button-primary button-block"
              disabled={bookingMutation.isPending || !addressId}
            >
              {bookingMutation.isPending ? (
                <>
                  <Spinner size={16} /> Creating booking…
                </>
              ) : (
                <>
                  <CalendarPlus size={17} /> Create booking
                </>
              )}
            </button>
            <p className="summary-note">
              The booking is created with a <strong>pending</strong> status. You
              can confirm it from the bookings page.
            </p>
          </aside>
        </form>
      )}
    </>
  );
}
