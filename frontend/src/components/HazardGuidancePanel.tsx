import { AlertTriangle, ShieldCheck, ListChecks, Sparkles, AlertCircle } from 'lucide-react';
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
  
  const rawDescription = guidance.description || guidance.incident_report || '';
  const translatedDescription = t(`hazard_guidance.${hazardKey}.description`, { defaultValue: rawDescription });

  const rawIssues = (guidance.issues && guidance.issues.length > 0) ? guidance.issues : (guidance.potential_problems || []);
  const translatedIssues = t(`hazard_guidance.${hazardKey}.issues`, { defaultValue: rawIssues, returnObjects: true }) as string[];

  const rawPrecautions = (guidance.precautions && guidance.precautions.length > 0) ? guidance.precautions : (guidance.how_to_overcome || []);
  const translatedPrecautions = t(`hazard_guidance.${hazardKey}.precautions`, { defaultValue: rawPrecautions, returnObjects: true }) as string[];

  const rawByproducts = (guidance.byproduct_issues && guidance.byproduct_issues.length > 0) ? guidance.byproduct_issues : (guidance.prevention_tips || []);
  const translatedByproducts = t(`hazard_guidance.${hazardKey}.byproduct_issues`, { defaultValue: rawByproducts, returnObjects: true }) as string[];

  const translatedEmergency = t(`hazard_guidance.${hazardKey}.emergency_note`, {
    defaultValue: guidance.emergency_note || 'In case of emergency, contact local authorities immediately (117 / 1990).',
  });

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-2 text-white shadow-md">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
            {t('hazard_guidance.response_guide', { defaultValue: 'Safety Guidelines & Action Plan' })}
          </div>
          <h4 className="mt-0.5 text-sm font-extrabold text-slate-900">{translatedTitle}</h4>
          {translatedDescription && <p className="mt-1 text-xs leading-relaxed text-slate-600 font-medium">{translatedDescription}</p>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Key Issues */}
        {translatedIssues && translatedIssues.length > 0 && (
          <section className="rounded-xl border border-rose-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-extrabold text-rose-700">
              <AlertTriangle className="h-4 w-4" /> {t('hazard_guidance.issues_label', { defaultValue: 'Key Issues & Impact' })}
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
              {translatedIssues.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Precautions & Actions User Can Take */}
        {translatedPrecautions && translatedPrecautions.length > 0 && (
          <section className="rounded-xl border border-emerald-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> {t('hazard_guidance.precautions_label', { defaultValue: 'Precautions (What You Can Do)' })}
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
              {translatedPrecautions.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-900">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Byproduct & Secondary Impacts */}
      {translatedByproducts && translatedByproducts.length > 0 && (
        <section className="rounded-xl border border-sky-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-extrabold text-sky-700">
            <ListChecks className="h-4 w-4" /> {t('hazard_guidance.byproduct_issues_label', { defaultValue: 'Secondary & Byproduct Impacts' })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {translatedByproducts.map((item, idx) => (
              <span key={idx} className="rounded-full border border-sky-200 bg-sky-50/90 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Emergency Note */}
      {translatedEmergency && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] font-medium leading-relaxed text-amber-900 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong className="uppercase tracking-wider">{t('hazard_guidance.emergency_note_label', { defaultValue: 'Emergency Note' })}: </strong>
            {translatedEmergency}
          </span>
        </p>
      )}
    </div>
  );
}