import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDepartments, fetchReportById, fetchReports, fetchWeather, submitReport, type Department, type Report, type ReportDetail } from '../api';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type FormState = {
  description: string;
  lat: string;
  lng: string;
  photo: File | null;
};

const initialForm: FormState = {
  description: '',
  lat: '',
  lng: '',
  photo: null,
};

export default function CitizenView() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportDetail, setReportDetail] = useState<ReportDetail | null>(null);
  const [lookupId, setLookupId] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);
  const [weather, setWeather] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadInitialData();
    const timer = window.setInterval(() => void loadReports(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const highRiskCount = useMemo(() => reports.filter((report) => report.dengue_risk === 'High').length, [reports]);

  async function loadInitialData() {
    await Promise.all([loadDepartments(), loadReports()]);
  }

  async function loadDepartments() {
    const data = await fetchDepartments();
    setDepartments(data);
  }

  async function loadReports() {
    const data = await fetchReports();
    setReports(data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.photo) {
      setStatus('Please choose a photo first.');
      return;
    }

    setLoading(true);
    setStatus(t('submitting'));

    try {
      const payload = new FormData();
      payload.append('photo', form.photo);
      payload.append('lat', form.lat);
      payload.append('lng', form.lng);
      payload.append('description', form.description);
      await submitReport(payload);
      setStatus('Report submitted successfully.');
      setForm(initialForm);
      await loadReports();
      if (form.lat && form.lng) {
        const weatherData = await fetchWeather(Number(form.lat), Number(form.lng));
        setWeather(weatherData);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  async function autofillLocation() {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setStatus('Location filled from browser GPS.');
      },
      () => setStatus('Could not read browser location. Please enter it manually.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function lookupReport() {
    if (!lookupId.trim()) {
      setStatus('Enter a report ID first.');
      return;
    }
    try {
      const detail = await fetchReportById(lookupId.trim());
      setReportDetail(detail);
      setStatus('Loaded report details.');
    } catch {
      setReportDetail(null);
      setStatus('Report not found.');
    }
  }

  return (
    <div className="text-white">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-md md:p-10 transition-all hover:border-white/20 hover:bg-white/10">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex rounded-full border border-sea/30 bg-sea/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sea">
              {t('app_title')}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              {t('app_subtitle')}
            </h1>
            <p className="text-base leading-7 text-slate-200 sm:text-lg">
              {t('app_description')}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Metric label={t('departments')} value={departments.length.toString()} accent="sea" />
            <Metric label={t('open_reports')} value={reports.length.toString()} accent="sun" />
            <Metric label={t('high_dengue_risk')} value={highRiskCount.toString()} accent="alert" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-night/95 p-6 shadow-glow backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white">{t('citizen_report_title')}</h2>
            <p className="mt-2 text-sm text-slate-300">{t('citizen_report_desc')}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label={t('latitude')}>
                <input className="input" value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} placeholder="7.8731" />
              </Field>
              <Field label={t('longitude')}>
                <input className="input" value={form.lng} onChange={(event) => setForm({ ...form, lng: event.target.value })} placeholder="80.7718" />
              </Field>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-200">Select location on map</label>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2" style={{ height: 240 }}>
                  <MapContainer
                    center={[form.lat ? Number(form.lat) : 7.8731, form.lng ? Number(form.lng) : 80.7718]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">Carto</a>' />
                    <MapClickHandler setLatLng={(lat, lng) => setForm({ ...form, lat: lat.toFixed(6), lng: lng.toFixed(6) })} />
                    {form.lat && form.lng ? (
                      <CircleMarker
                        center={[Number(form.lat), Number(form.lng)]}
                        radius={10}
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.7 }}
                      />
                    ) : null}
                  </MapContainer>
                </div>
              </div>
              <Field label={t('photo')} full>
                <input
                  className="input file:mr-4 file:rounded-full file:border-0 file:bg-sea file:px-4 file:py-2 file:font-semibold file:text-white cursor-pointer hover:file:bg-emerald-500 transition-colors"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setForm({ ...form, photo: event.target.files?.[0] ?? null })}
                />
              </Field>
              <Field label={t('description')} full>
                <textarea
                  className="input min-h-32 resize-none"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Blocked drain near the bus stop..."
                />
              </Field>
            </div>

            <button type="button" onClick={autofillLocation} className="mt-4 inline-flex items-center rounded-full border border-sea/30 bg-sea/10 px-5 py-2 text-sm font-semibold text-sea transition hover:bg-sea/20">
              {t('use_location')}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex items-center rounded-full bg-sun px-6 py-3 font-semibold text-ink transition hover:scale-105 hover:brightness-110 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? t('submitting') : t('submit_report')}
            </button>

            {status ? <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 backdrop-blur-md">{status}</p> : null}

            {weather ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <h3 className="font-semibold text-white">{t('weather_preview')}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {weather.days?.slice(0, 3).map((day: any) => (
                    <div key={day.date} className="rounded-2xl bg-black/20 p-3 text-sm text-slate-200">
                      <div className="font-semibold text-white">{day.date}</div>
                      <div>{day.precipitation_sum_mm} mm rain</div>
                      <div>{day.precipitation_probability_max}% probability</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <h3 className="font-semibold text-white">{t('status_lookup')}</h3>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input className="input flex-1" value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="Paste report ID here" />
                <button type="button" onClick={lookupReport} className="rounded-full bg-sea px-5 py-3 font-semibold text-ink transition hover:scale-105">
                  {t('look_up')}
                </button>
              </div>
              {reportDetail ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                  <div className="font-semibold text-white">{reportDetail.hazard_type}</div>
                  <div>{reportDetail.severity} · {reportDetail.status} · {reportDetail.dengue_risk}</div>
                  <div className="mt-1 text-slate-300">{reportDetail.description ?? 'No description provided.'}</div>
                  <div className="mt-1 text-xs text-slate-400">Updated: {reportDetail.updated_at}</div>
                </div>
              ) : null}
            </div>
          </form>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">{t('department_routing')}</h2>
              <div className="mt-4 space-y-3">
                {departments.map((department) => (
                  <div key={department.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20 transition-colors">
                    <div className="font-semibold text-white">{department.name}</div>
                    <div className="mt-1 text-sm text-slate-300">{department.issue_types.join(', ')}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">{t('latest_reports')}</h2>
              <div className="mt-4 space-y-3">
                {reports.slice(0, 6).map((report) => (
                  <article key={report.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20 transition-colors cursor-default">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-white">{report.hazard_type}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskClass(report.dengue_risk)}`}>{report.dengue_risk}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{report.severity} · {report.status} · {report.department_name ?? 'Unassigned'}</div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? 'sm:col-span-2' : ''}>
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: 'sea' | 'sun' | 'alert' }) {
  const accents = {
    sea: 'from-sea/30 to-white/5 text-sea border-sea/30',
    sun: 'from-sun/30 to-white/5 text-sun border-sun/30',
    alert: 'from-alert/30 to-white/5 text-alert border-alert/30',
  } as const;

  return (
    <div className={`rounded-3xl border bg-gradient-to-br ${accents[accent]} p-5 backdrop-blur-md transition-transform hover:scale-105`}>
      <div className="text-sm uppercase tracking-[0.25em] text-slate-200">{label}</div>
      <div className="mt-2 text-4xl font-black">{value}</div>
    </div>
  );
}

function riskClass(level: string) {
  if (level === 'High') return 'bg-alert/15 text-alert border border-alert/30';
  if (level === 'Medium') return 'bg-sun/15 text-sun border border-sun/30';
  return 'bg-sea/15 text-sea border border-sea/30';
}

function MapClickHandler({ setLatLng }: { setLatLng: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      setLatLng(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
