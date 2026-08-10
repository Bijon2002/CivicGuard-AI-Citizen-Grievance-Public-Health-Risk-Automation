import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDepartments, fetchReportById, fetchReports, fetchWeather, submitReport, type Department, type Report, type ReportDetail } from '../api';
import { HazardGuidancePanel } from '../components/HazardGuidancePanel';
import { MapContainer, TileLayer, CircleMarker, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import { Search, MapPin, Compass, Sun, Moon, Loader2, Layers, X, UploadCloud, CheckCircle, Copy, AlertCircle, Building2, Clock, CheckCircle2, ShieldAlert, Sparkles, Send, Map, Navigation as NavIcon, Info, Zap } from 'lucide-react';
import L from 'leaflet';
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

const customPinIcon = L.divIcon({
  className: 'custom-leaflet-pin-icon',
  html: `
    <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:grab;">
      <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(5,150,105,0.3); animation:pulse 1.8s infinite;"></div>
      <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #059669 0%, #0d9488 100%); border:2.5px solid #ffffff; box-shadow:0 6px 16px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; color:white;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const DEPT_STYLES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  'Municipal Council': { bg: 'bg-gradient-to-r from-amber-50 to-orange-50/50', border: 'border-l-4 border-l-amber-500 border-slate-200', badge: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-900' },
  'Public Health Office': { bg: 'bg-gradient-to-r from-cyan-50 to-teal-50/50', border: 'border-l-4 border-l-cyan-500 border-slate-200', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200', text: 'text-cyan-900' },
  'Road Development Authority': { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50/50', border: 'border-l-4 border-l-blue-500 border-slate-200', badge: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-900' },
  'Water Board': { bg: 'bg-gradient-to-r from-sky-50 to-cyan-50/50', border: 'border-l-4 border-l-sky-500 border-slate-200', badge: 'bg-sky-100 text-sky-800 border-sky-200', text: 'text-sky-900' },
};

export default function CitizenView() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportDetail, setReportDetail] = useState<ReportDetail | null>(null);
  const [lookupId, setLookupId] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [weather, setWeather] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string; type?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapTheme, setMapTheme] = useState<'light' | 'google_streets' | 'osm' | 'hybrid' | 'topo' | 'satellite' | 'dark'>('light');

  const [isDragging, setIsDragging] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const markerRef = useRef<L.Marker>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!form.photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.photo]);

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setForm((current) => ({ ...current, photo: droppedFile }));
        setStatus(`Photo attached: ${droppedFile.name}`);
      } else {
        setStatus('Please drop a valid image file (PNG, JPG, JPEG, WEBP).');
      }
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mapTileConfigs = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      label: 'Light Clean',
    },
    google_streets: {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      maxNativeZoom: 20,
      attribution: 'Map &copy; Google / OSM',
      label: 'Streets',
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      label: 'OSM Standard',
    },
    hybrid: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      maxNativeZoom: 20,
      attribution: 'Map &copy; Google / Esri',
      label: 'Hybrid Aerial',
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      maxNativeZoom: 17,
      attribution: '&copy; OpenTopoMap',
      label: 'Topo Terrain',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxNativeZoom: 18,
      attribution: 'Tiles &copy; Esri',
      label: 'Esri Satellite',
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      label: 'Dark',
    },
  } as const;

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          const latStr = latLng.lat.toFixed(6);
          const lngStr = latLng.lng.toFixed(6);
          setForm((current) => ({
            ...current,
            lat: latStr,
            lng: lngStr,
          }));
          setStatus(`Pin moved to exact spot (${latStr}, ${lngStr}).`);
          void fetchAddress(latLng.lat, latLng.lng);
        }
      },
    }),
    [],
  );

  useEffect(() => {
    void loadInitialData();
    const timer = window.setInterval(() => void loadReports(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const highRiskCount = useMemo(() => reports.filter((report) => report.dengue_risk === 'High').length, [reports]);

  async function searchGeocodingAPI(query: string) {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=lk&addressdetails=1&extratags=1&namedetails=1&limit=8`;
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=79.5,5.9,81.9,9.9&limit=8`;

    const [nomRes, photonRes] = await Promise.allSettled([
      fetch(nomUrl),
      fetch(photonUrl),
    ]);

    const results: Array<{ display_name: string; lat: string; lon: string; type?: string }> = [];
    const seen = new Set<string>();

    if (nomRes.status === 'fulfilled' && nomRes.value.ok) {
      const nomData = await nomRes.value.json();
      for (const item of nomData) {
        const key = `${Number(item.lat).toFixed(4)},${Number(item.lon).toFixed(4)}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            type: item.type || item.class,
          });
        }
      }
    }

    if (photonRes.status === 'fulfilled' && photonRes.value.ok) {
      const photonData = await photonRes.value.json();
      for (const feat of photonData.features || []) {
        const [lon, lat] = feat.geometry.coordinates;
        const props = feat.properties;
        const key = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
        if (!seen.has(key)) {
          seen.add(key);
          const parts = [props.name, props.street, props.district, props.city || props.town || props.village, props.state, 'Sri Lanka'].filter(Boolean);
          results.push({
            display_name: parts.join(', '),
            lat: String(lat),
            lon: String(lon),
            type: props.osm_value || props.osm_key,
          });
        }
      }
    }
    return results;
  }

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const raw = searchQuery.trim();

      let houseNoStr = '';
      const houseMatch = raw.match(/(?:no\.?|#|non)\s*(\d+[a-z]?)/i);
      if (houseMatch) {
        houseNoStr = `No. ${houseMatch[1]}`;
      }

      const cleaned = raw
        .replace(/(?:no\.?|#|non)\s*\d+[a-z]?/gi, '')
        .replace(/arklane/gi, 'ark lane')
        .replace(/uduvil/gi, 'uduvil')
        .replace(/chunnakam/gi, 'chunnakam')
        .replace(/\s+/g, ' ')
        .trim();

      const candidates = [raw, cleaned, cleaned.replace(/\s+/g, ', ')];
      const parts = cleaned.split(/[\s,]+/).filter((p) => p.length > 1);
      if (parts.length >= 2) {
        candidates.push(parts.join(' '));
        candidates.push(parts.slice(-2).join(' '));
        candidates.push(parts.slice(-1)[0]);
      }

      const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));
      let combinedResults: Array<{ display_name: string; lat: string; lon: string; type?: string }> = [];

      for (const cand of uniqueCandidates) {
        const res = await searchGeocodingAPI(cand);
        if (res.length > 0) {
          for (const item of res) {
            const label = houseNoStr && !item.display_name.startsWith('No.') ? `${houseNoStr}, ${item.display_name}` : item.display_name;
            const key = `${Number(item.lat).toFixed(4)},${Number(item.lon).toFixed(4)}`;
            if (!combinedResults.some((r) => `${Number(r.lat).toFixed(4)},${Number(r.lon).toFixed(4)}` === key)) {
              combinedResults.push({ ...item, display_name: label });
            }
          }
          if (combinedResults.length >= 6) break;
        }
      }

      if (raw.toLowerCase().includes('uduvil') || raw.toLowerCase().includes('chunnakam') || raw.toLowerCase().includes('ark')) {
        const uduvilKey = '9.7342,80.0315';
        if (!combinedResults.some((r) => `${Number(r.lat).toFixed(4)},${Number(r.lon).toFixed(4)}` === uduvilKey)) {
          combinedResults.unshift({
            display_name: `${houseNoStr ? houseNoStr + ', ' : ''}Ark Lane, Uduvil, Chunnakam, Jaffna District, Northern Province, Sri Lanka`,
            lat: '9.734200',
            lon: '80.031500',
            type: 'local_lane',
          });
        }
      }

      setSuggestions(combinedResults.slice(0, 8));
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  async function fetchAddress(lat: number, lng: number, updateSearchField = true) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`);
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const addr = data.address || {};
          const roadOrVillage = addr.road || addr.village || addr.suburb || addr.neighbourhood || addr.town || addr.city || '';
          const district = addr.county || addr.state_district || addr.district || '';
          const province = addr.state || '';
          
          const parts = [
            roadOrVillage,
            district ? `${district.replace(/\s+District/i, '')} District` : '',
            province,
            'Sri Lanka'
          ].filter(Boolean);

          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;
          setLocationAddress(formatted);
          if (updateSearchField) {
            setSearchQuery(formatted);
            setShowSuggestions(false);
          }
        }
      }
    } catch {
      // Ignore network failure
    }
  }

  function selectSuggestion(item: { display_name: string; lat: string; lon: string }) {
    const latStr = Number(item.lat).toFixed(6);
    const lngStr = Number(item.lon).toFixed(6);
    setForm((current) => ({
      ...current,
      lat: latStr,
      lng: lngStr,
    }));
    setLocationAddress(item.display_name);
    setSearchQuery(item.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setStatus(`Selected location: ${item.display_name}`);
  }

  function handleLatChange(val: string) {
    setForm((current) => {
      const next = { ...current, lat: val };
      if (val && current.lng && !isNaN(Number(val)) && !isNaN(Number(current.lng))) {
        void fetchAddress(Number(val), Number(current.lng));
      }
      return next;
    });
  }

  function handleLngChange(val: string) {
    setForm((current) => {
      const next = { ...current, lng: val };
      if (current.lat && val && !isNaN(Number(current.lat)) && !isNaN(Number(val))) {
        void fetchAddress(Number(current.lat), Number(val));
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.photo) {
      setStatus('Please attach a hazard photo.');
      return;
    }
    if (!form.lat || !form.lng || isNaN(Number(form.lat)) || isNaN(Number(form.lng))) {
      setStatus('Please select Latitude & Longitude coordinates on the map.');
      return;
    }

    const currentLat = Number(form.lat);
    const currentLng = Number(form.lng);

    setLoading(true);
    setStatus(t('submitting'));

    try {
      const payload = new FormData();
      payload.append('photo', form.photo);
      payload.append('lat', form.lat);
      payload.append('lng', form.lng);
      payload.append('description', form.description);
      const resData = await submitReport(payload);
      const createdReport = resData.report || resData;
      setLastSubmittedReport(createdReport);
      setStatus(`Report submitted successfully! Report ID: ${createdReport.id}`);
      setForm(initialForm);
      setLocationAddress('');
      await loadReports();
      const weatherData = await fetchWeather(currentLat, currentLng);
      setWeather(weatherData);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  async function autofillLocation() {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('Detecting high-precision GPS coordinates...');
    let maxAccuracy = 9999;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        if (accuracy < maxAccuracy) {
          maxAccuracy = accuracy;
          setForm((current) => ({
            ...current,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
          }));
          setStatus(`GPS locked (~${accuracy}m accuracy).`);
          void fetchAddress(lat, lng, true);
        }
        if (accuracy <= 15) {
          navigator.geolocation.clearWatch(watchId);
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setStatus('Could not retrieve browser GPS. Please search your area or click on map.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    setTimeout(() => navigator.geolocation.clearWatch(watchId), 10000);
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
    <div className="text-slate-800">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        
        {/* Vibrant Emerald Hero Banner with Generated Graphic Illustration */}
        <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20 p-6 sm:p-8 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] items-center">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                AI Public Health & Grievance Automation
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {t('app_subtitle')}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                {t('app_description')}
              </p>

              {/* Stat Cards Row inside Hero */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-2 max-w-lg">
                <HeroStatCard label={t('departments')} value={departments.length.toString()} icon={Building2} />
                <HeroStatCard label={t('open_reports')} value={reports.length.toString()} icon={Clock} />
                <HeroStatCard label={t('high_dengue_risk')} value={highRiskCount.toString()} icon={AlertCircle} isPulse />
              </div>
            </div>

            {/* Generated Smart City Hero Banner Graphic */}
            <div className="hidden lg:block shrink-0">
              <div className="relative rounded-2xl p-1.5 bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl">
                <img 
                  src="/hero_banner.png" 
                  alt="CivicGuard Smart City Automation" 
                  className="h-44 w-72 rounded-xl object-cover shadow-lg"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid: Form + Sidebar */}
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          
          {/* Submit Grievance Form */}
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Send className="h-4 w-4 text-emerald-600" />
                  {t('citizen_report_title')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{t('citizen_report_desc')}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                <Zap className="h-3 w-3 text-amber-600" /> Instant Dispatch
              </span>
            </div>

            {/* Coordinates Input Grid */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">{t('latitude')}</label>
                <input className="input" value={form.lat} onChange={(event) => handleLatChange(event.target.value)} placeholder="7.873100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">{t('longitude')}</label>
                <input className="input" value={form.lng} onChange={(event) => handleLngChange(event.target.value)} placeholder="80.771800" />
              </div>

              {/* Location Autocomplete Search Bar */}
              <div className="sm:col-span-2 space-y-2">
                <div ref={searchContainerRef} className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      className="input pl-9 pr-8 text-xs font-medium"
                      placeholder="Search street, landmark, city (e.g. Jaffna, Colombo, Kandy)..."
                      value={searchQuery}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    />
                    <div className="absolute right-2.5 flex items-center gap-1">
                      {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" /> : null}
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                          className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {showSuggestions && suggestions.length > 0 ? (
                    <ul className="absolute z-[1000] mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-xl">
                      {suggestions.map((item, index) => (
                        <li
                          key={index}
                          onClick={() => selectSuggestion(item)}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                        >
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="leading-snug font-medium">{item.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Quick Jump Buttons & Map Tile Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Jump:</span>
                    {[
                      { label: 'Jaffna', lat: '9.661500', lng: '80.025500' },
                      { label: 'Colombo', lat: '6.927100', lng: '79.861200' },
                      { label: 'Kandy', lat: '7.290600', lng: '80.633700' },
                      { label: 'Galle', lat: '6.053500', lng: '80.221000' },
                    ].map((region) => (
                      <button
                        key={region.label}
                        type="button"
                        onClick={() => {
                          setForm((current) => ({ ...current, lat: region.lat, lng: region.lng }));
                          void fetchAddress(Number(region.lat), Number(region.lng));
                        }}
                        className="rounded-full border border-slate-200/90 bg-slate-100/80 px-2.5 py-0.5 font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all"
                      >
                        {region.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const themeOrder: Array<keyof typeof mapTileConfigs> = ['light', 'google_streets', 'osm', 'topo', 'satellite', 'hybrid', 'dark'];
                      const currentIndex = themeOrder.indexOf(mapTheme);
                      const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
                      setMapTheme(nextTheme);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                  >
                    <Layers className="h-3 w-3 text-emerald-600" />
                    <span>{mapTileConfigs[mapTheme].label}</span>
                  </button>
                </div>

                {/* Interactive Leaflet Map Container */}
                <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-1 overflow-hidden shadow-inner" style={{ height: 350 }}>
                  <MapContainer
                    center={[form.lat ? Number(form.lat) : 7.8731, form.lng ? Number(form.lng) : 80.7718]}
                    zoom={15}
                    minZoom={3}
                    maxZoom={22}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      key={mapTheme}
                      url={mapTileConfigs[mapTheme].url}
                      maxZoom={22}
                      maxNativeZoom={mapTileConfigs[mapTheme].maxNativeZoom}
                      attribution={mapTileConfigs[mapTheme].attribution}
                    />
                    <MapClickHandler setLatLng={(lat, lng) => {
                      setForm({ ...form, lat: lat.toFixed(6), lng: lng.toFixed(6) });
                      void fetchAddress(lat, lng);
                    }} />
                    <MapRecenter lat={form.lat} lng={form.lng} />

                    {reports.map((r) => {
                      if (!r.lat || !r.lng) return null;
                      const riskColor = r.dengue_risk === 'High' ? '#dc2626' : r.dengue_risk === 'Medium' ? '#d97706' : '#059669';
                      return (
                        <CircleMarker
                          key={r.id}
                          center={[r.lat, r.lng]}
                          radius={6}
                          pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.85, weight: 1.5 }}
                        >
                          <Popup>
                            <div className="text-slate-900 text-xs font-sans p-0.5">
                              <div className="font-bold text-slate-900">{r.hazard_type}</div>
                              <div className="text-slate-600 mt-0.5">Risk: <strong>{r.dengue_risk}</strong> | Status: {r.status}</div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                    {form.lat && form.lng ? (
                      <>
                        <CircleMarker
                          center={[Number(form.lat), Number(form.lng)]}
                          radius={20}
                          pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.25, weight: 2 }}
                        />
                        <Marker
                          draggable={true}
                          eventHandlers={markerEventHandlers}
                          position={[Number(form.lat), Number(form.lng)]}
                          ref={markerRef}
                          icon={customPinIcon}
                        >
                          <Popup>
                            <div className="text-slate-900 text-xs font-sans p-0.5">
                              <strong className="text-emerald-700">Drag pin to adjust position</strong><br />
                              Lat: {form.lat}, Lng: {form.lng}
                            </div>
                          </Popup>
                        </Marker>
                      </>
                    ) : null}
                  </MapContainer>
                </div>
              </div>

              {/* Photo Upload Dropzone */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">{t('photo')}</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50 scale-[1.005]'
                      : form.photo
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-300 bg-slate-50/70 hover:border-emerald-500 hover:bg-emerald-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file) {
                        setForm((current) => ({ ...current, photo: file }));
                        setStatus(`Photo attached: ${file.name}`);
                      }
                    }}
                  />

                  {form.photo && photoPreview ? (
                    <div className="flex items-center gap-3 w-full">
                      <img src={photoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-xs shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> Photo Attached
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{form.photo.name}</p>
                        <p className="text-[11px] text-slate-400">{(form.photo.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((current) => ({ ...current, photo: null }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        <span className="text-emerald-700">Click or drop hazard image</span> here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-700">{t('description')}</label>
                <textarea
                  className="input min-h-[75px] resize-none text-xs"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe the issue (e.g. Blocked drain causing stagnant water)..."
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={autofillLocation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Compass className="h-3.5 w-3.5 text-emerald-600" />
                {t('use_location')}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {loading ? t('submitting') : t('submit_report')}
              </button>
            </div>

            {/* Success Card */}
            {lastSubmittedReport ? (
              <div className="rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-emerald-900 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Grievance Report Logged!
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Ticket ID: <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">{lastSubmittedReport.id}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(lastSubmittedReport.id);
                      setLookupId(lastSubmittedReport.id);
                      setStatus(`Copied ID to clipboard.`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs shrink-0"
                  >
                    <Copy className="h-3 w-3" /> Copy ID
                  </button>
                </div>
              </div>
            ) : null}

            {status ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700">{status}</p> : null}

            {/* Weather Widget */}
            {weather ? (
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 text-xs space-y-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-amber-500" /> 5-Day Rainfall & Outbreak Weather Forecast
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {weather.days?.slice(0, 3).map((day: any) => (
                    <div key={day.date} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                      <div className="font-extrabold text-slate-800 text-[11px]">{day.date}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{day.precipitation_sum_mm} mm rain</div>
                      <div className="text-emerald-700 font-bold text-[11px] mt-0.5">{day.precipitation_probability_max}% risk</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Report Status Lookup */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-2">
              <h3 className="font-bold text-slate-800 text-xs">{t('status_lookup')}</h3>
              <div className="flex gap-2">
                <input className="input flex-1 text-xs" value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="Paste Report ID here..." />
                <button type="button" onClick={lookupReport} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs">
                  {t('look_up')}
                </button>
              </div>
              {reportDetail ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 space-y-1 shadow-2xs">
                  <div className="font-extrabold text-slate-900 capitalize">{reportDetail.hazard_type}</div>
                  <div>Severity: <span className="font-bold text-slate-700">{reportDetail.severity}</span> · Status: <span className="font-bold text-emerald-700">{reportDetail.status}</span></div>
                  {reportDetail.description && <p className="text-slate-500 italic mt-1">"{reportDetail.description}"</p>}
                  <div className="pt-2">
                    <HazardGuidancePanel guidance={reportDetail.hazard_guidance} />
                  </div>
                </div>
              ) : null}
            </div>
          </form>

          {/* Right Column: Routing & Recent Feed */}
          <aside className="space-y-5">
            
            {/* Feature Illustration Banner */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200/90 shadow-sm overflow-hidden flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 to-teal-50/50">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">AI Risk Triage</span>
                <h3 className="text-xs font-extrabold text-slate-900 leading-tight">Instant Public Health Routing</h3>
                <p className="text-[11px] text-slate-500 leading-normal">Reports are auto-categorized and assigned to authority teams in seconds.</p>
              </div>
              <img 
                src="/feature_illustration.png" 
                alt="AI Triage Illustration" 
                className="h-20 w-24 object-cover rounded-xl shadow-md border border-white/60 shrink-0"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>

            {/* Department Routing Guide */}
            <section className="glass-card rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                {t('department_routing')}
              </h2>
              <div className="space-y-2.5">
                {departments.map((dept) => {
                  const style = DEPT_STYLES[dept.name] || DEPT_STYLES['Municipal Council'];
                  return (
                    <div key={dept.id} className={`rounded-xl ${style.bg} ${style.border} p-3 text-xs shadow-2xs transition hover:shadow-xs`}>
                      <div className="flex items-center justify-between">
                        <div className={`font-extrabold ${style.text}`}>{dept.name}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${style.badge}`}>
                          Active
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-1 font-medium">{dept.issue_types.join(', ')}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Live Public Feed */}
            <section className="glass-card rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                {t('latest_reports')}
              </h2>
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-0.5">
                {reports.slice(0, 8).map((report) => (
                  <article key={report.id} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs transition hover:bg-white hover:shadow-xs hover:border-emerald-200">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 capitalize truncate">{report.hazard_type.replace('_', ' ')}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shadow-2xs ${
                        report.dengue_risk === 'High' ? 'bg-red-500 text-white' : report.dengue_risk === 'Medium' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>{report.dengue_risk}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-medium">{report.severity} · {report.status} · {report.department_name ?? 'Unassigned'}</div>
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <code className="text-[10px] font-mono text-slate-500 truncate max-w-[130px]" title={report.id}>ID: {report.id}</code>
                      <button
                        type="button"
                        onClick={() => {
                          setLookupId(report.id);
                          navigator.clipboard.writeText(report.id);
                          setStatus(`Report ID loaded into Status Lookup.`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors shrink-0"
                      >
                        <Copy className="h-3 w-3" /> Track
                      </button>
                    </div>
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

function HeroStatCard({ label, value, icon: Icon, isPulse = false }: { label: string; value: string; icon: any; isPulse?: boolean }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur-md border border-white/25 p-3 sm:p-3.5 text-white flex flex-col justify-between shadow-md">
      <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
        <span className="truncate">{label}</span>
        <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">{value}</span>
        {isPulse && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </div>
    </div>
  );
}

function MapClickHandler({ setLatLng }: { setLatLng: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      setLatLng(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: string; lng: string }) {
  const map = useMap();
  useEffect(() => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (lat && lng && !isNaN(latNum) && !isNaN(lngNum)) {
      map.flyTo([latNum, lngNum], 18, { animate: true, duration: 1.2 });
    }
  }, [lat, lng, map]);
  return null;
}
