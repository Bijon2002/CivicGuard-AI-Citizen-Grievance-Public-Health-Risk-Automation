import { AlertTriangle, ShieldCheck, ListChecks, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { HazardGuidance } from '../api';

function normalizeHazardKey(hazardType: string) {
  return hazardType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function HazardGuidancePanel({ guidance }: { guidance?: HazardGuidance | null }) {
  const { t } = useTranslation();
  if (!guidance) return null;

  const hazardKey = normalizeHazardKey(guidance.hazard_type);
  const translatedTitle = t(`hazard_guidance.${hazardKey}.display_name`, { defaultValue: guidance.display_name });
  const translatedIncident = t(`hazard_guidance.${hazardKey}.incident_report`, { defaultValue: guidance.incident_report });
  const translatedProblems = t(`hazard_guidance.${hazardKey}.potential_problems`, { defaultValue: guidance.potential_problems, returnObjects: true }) as string[];
  const translatedSteps = t(`hazard_guidance.${hazardKey}.how_to_overcome`, { defaultValue: guidance.how_to_overcome, returnObjects: true }) as string[];
  const translatedTips = t(`hazard_guidance.${hazardKey}.prevention_tips`, { defaultValue: guidance.prevention_tips, returnObjects: true }) as string[];
  const translatedEmergency = t(`hazard_guidance.${hazardKey}.emergency_note`, { defaultValue: guidance.emergency_note });

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-600 p-2 text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">{t('hazard_guidance.response_guide', { defaultValue: 'Response Guide' })}</div>
          <h4 className="mt-0.5 text-sm font-extrabold text-slate-900">{translatedTitle}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{translatedIncident}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-rose-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-extrabold text-rose-700">
            <AlertTriangle className="h-4 w-4" /> {t('hazard_guidance.potential_problems_label', { defaultValue: 'Potential Problems / Consequences' })}
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
            {translatedProblems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-emerald-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> {t('hazard_guidance.how_to_overcome_label', { defaultValue: 'How to Overcome' })}
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
            {translatedSteps.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-sky-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-extrabold text-sky-700">
          <ListChecks className="h-4 w-4" /> {t('hazard_guidance.prevention_tips_label', { defaultValue: 'Prevention Tips' })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {translatedTips.map((item) => (
            <span key={item} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
              {item}
            </span>
          ))}
        </div>
      </section>

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-amber-900">
        <span className="font-extrabold uppercase tracking-wider">{t('hazard_guidance.emergency_note_label', { defaultValue: 'Emergency note' })}: </span>
        {translatedEmergency}
      </p>
    </div>
  );
}