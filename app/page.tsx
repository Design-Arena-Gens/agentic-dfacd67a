"use client";
import React from 'react';

type PlannerInput = {
  niche: string;
  audience: string;
  tone: 'friendly' | 'professional' | 'humorous' | 'inspirational';
  postsPerWeek: number;
  pillars: string; // comma-separated
  brandKeywords: string;
  offers: string;
  ctas: string;
};

type PlanItem = {
  id: string;
  date: string; // ISO date
  pillar: string;
  format: 'Reel' | 'Carousel' | 'Single' | 'Story';
  idea: string;
  caption?: string;
  hashtags?: string[];
};

const today = () => new Date();

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function pickFormat(idx: number): PlanItem['format'] {
  const seq: PlanItem['format'][] = ['Reel', 'Carousel', 'Single', 'Story'];
  return seq[idx % seq.length];
}

function normalizeList(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function generateIdea(niche: string, pillar: string, format: PlanItem['format']) {
  const hooks = [
    `3 ${pillar} secrets in ${niche} nobody shares`,
    `Common ${pillar} mistakes in ${niche}`,
    `Before/After: ${pillar} transformation in ${niche}`,
    `7-day ${pillar} challenge for ${niche}`,
    `Quick ${pillar} strategy for ${niche}`,
  ];
  const base = hooks[Math.floor(Math.random() * hooks.length)];
  if (format === 'Reel') return `${base} (Reel)`;
  if (format === 'Carousel') return `${base} (5-slide carousel)`;
  if (format === 'Story') return `${base} (3 stories + 1 poll)`;
  return `${base} (Single post)`;
}

function generateCaption(opts: {
  niche: string;
  audience: string;
  tone: PlannerInput['tone'];
  pillar: string;
  idea: string;
  brandKeywords: string[];
  offers: string[];
  ctas: string[];
  hashtags: string[];
}): string {
  const { tone, idea, pillar, audience, brandKeywords, offers, ctas, hashtags, niche } = opts;
  const toneHint: Record<PlannerInput['tone'], string> = {
    friendly: 'Friendly and clear tone',
    professional: 'Professional and concise tone',
    humorous: 'Playful tone with light humor',
    inspirational: 'Motivational and inspiring tone',
  };
  const opening = `Hook: ${idea}\n\n`;
  const value = `Value: If you're ${audience} in ${niche}, these ${pillar} tips help:\n? Tip 1\n? Tip 2\n? Tip 3\n`;
  const brand = brandKeywords.length ? `\nBrand keywords: ${brandKeywords.join(', ')}` : '';
  const offer = offers.length ? `\nOffer: ${offers[0]}` : '';
  const cta = ctas.length ? `\nCTA: ${ctas[0]}` : `\nCTA: Save and share if useful.`;
  const tags = hashtags.length ? `\n\n${hashtags.map((h)=>`#${h.replace(/#/g,'')}`).join(' ')}` : '';
  return `${toneHint[tone]}\n\n${opening}${value}${brand}${offer}${cta}${tags}`.trim();
}

function generateHashtags(niche: string, audience: string, keywords: string[]): string[] {
  const base = [
    'business', 'growth', 'marketing', 'content', 'strategy', 'experience', 'learn', 'instagram', 'contentcreation', 'creator',
  ];
  const seed = [
    ...normalizeList(niche.replace(/#/g,'').replace(/\s+/g,'_')),
    ...normalizeList(audience.replace(/#/g,'').replace(/\s+/g,'_')),
    ...keywords.map(k=>k.replace(/#/g,'').replace(/\s+/g,'_')),
  ].filter(Boolean);
  const set = new Set<string>();
  for (const s of seed) set.add(s.toLowerCase());
  for (const b of base) set.add(b.toLowerCase());
  return Array.from(set).slice(0, 24);
}

export default function Page() {
  const [input, setInput] = React.useState<PlannerInput>({
    niche: '',
    audience: '',
    tone: 'friendly',
    postsPerWeek: 4,
    pillars: 'Education, Inspiration, Behind the scenes, Sales',
    brandKeywords: '',
    offers: '',
    ctas: 'Save for later, Comment your thoughts, Share with a friend',
  });
  const [plan, setPlan] = React.useState<PlanItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem('planner_state_v1');
    if (raw) {
      try { const parsed = JSON.parse(raw); setInput(parsed.input); setPlan(parsed.plan); } catch {}
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('planner_state_v1', JSON.stringify({ input, plan }));
  }, [input, plan]);

  function buildPlan() {
    const pillars = normalizeList(input.pillars);
    const totalDays = 30;
    const posts = Math.max(1, Math.min(7, input.postsPerWeek));
    const everyNDays = Math.floor(7 / posts) || 1;

    const results: PlanItem[] = [];
    const start = today();
    for (let d = 0, idx = 0; d < totalDays; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      if ((d % 7) % everyNDays === 0) {
        const pillar = pillars[idx % pillars.length] || 'General';
        const format = pickFormat(idx);
        const idea = generateIdea(input.niche || 'your niche', pillar, format);
        results.push({ id: `${formatDate(date)}-${idx}`, date: formatDate(date), pillar, format, idea });
        idx++;
      }
    }
    setPlan(results);
    setSelectedId(results[0]?.id ?? null);
  }

  function enrichSelected() {
    if (!selectedId) return;
    setPlan((prev) => {
      const p = [...prev];
      const i = p.findIndex((x) => x.id === selectedId);
      if (i === -1) return p;
      const item = p[i];
      const hashtags = generateHashtags(input.niche, input.audience, normalizeList(input.brandKeywords));
      const caption = generateCaption({
        niche: input.niche,
        audience: input.audience,
        tone: input.tone,
        pillar: item.pillar,
        idea: item.idea,
        brandKeywords: normalizeList(input.brandKeywords),
        offers: normalizeList(input.offers),
        ctas: normalizeList(input.ctas),
        hashtags,
      });
      p[i] = { ...item, caption, hashtags };
      return p;
    });
  }

  function enrichAll() {
    const hashtags = generateHashtags(input.niche, input.audience, normalizeList(input.brandKeywords));
    setPlan((prev) => prev.map((item) => ({
      ...item,
      hashtags,
      caption: generateCaption({
        niche: input.niche,
        audience: input.audience,
        tone: input.tone,
        pillar: item.pillar,
        idea: item.idea,
        brandKeywords: normalizeList(input.brandKeywords),
        offers: normalizeList(input.offers),
        ctas: normalizeList(input.ctas),
        hashtags,
      }),
    })));
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function exportCSV() {
    const headers = ['date','format','pillar','idea','caption','hashtags'];
    const rows = plan.map(p => [p.date, p.format, p.pillar, p.idea.replace(/\n/g,' '), (p.caption||'').replace(/\n/g,' '), (p.hashtags||[]).map(h=>`#${h}`).join(' ')]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plan.csv'; a.click(); URL.revokeObjectURL(url);
  }

  const selected = plan.find(p => p.id === selectedId) || null;

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <div className="title">Social Media Assistant</div>
            <div className="subtitle">30-day planner + caption & hashtag generator</div>
          </div>
        </div>
        <span className="badge">Offline ? No API</span>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Strategy Inputs</h3>
          <div className="row">
            <div>
              <label>Niche</label>
              <input value={input.niche} onChange={e=>setInput({...input,niche:e.target.value})} placeholder="e.g. Women?s fitness" />
            </div>
            <div>
              <label>Audience Persona</label>
              <input value={input.audience} onChange={e=>setInput({...input,audience:e.target.value})} placeholder="e.g. Busy professionals" />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Brand Tone</label>
              <select value={input.tone} onChange={e=>setInput({...input,tone:e.target.value as PlannerInput['tone']})}>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="humorous">Humorous</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
            <div>
              <label>Posts per week</label>
              <input type="number" min={1} max={7} value={input.postsPerWeek} onChange={e=>setInput({...input,postsPerWeek: Number(e.target.value)})} />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Content pillars (comma separated)</label>
              <input value={input.pillars} onChange={e=>setInput({...input,pillars:e.target.value})} />
            </div>
            <div>
              <label>Brand keywords</label>
              <input value={input.brandKeywords} onChange={e=>setInput({...input,brandKeywords:e.target.value})} placeholder="e.g. bodybuilding, strength" />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Offers (optional)</label>
              <input value={input.offers} onChange={e=>setInput({...input,offers:e.target.value})} placeholder="e.g. 30% off code" />
            </div>
            <div>
              <label>CTAs (comma separated)</label>
              <input value={input.ctas} onChange={e=>setInput({...input,ctas:e.target.value})} placeholder="e.g. Save for later, Share with a friend" />
            </div>
          </div>

          <div className="btns">
            <button className="btn primary" onClick={buildPlan}>Generate 30-day plan</button>
            <button className="btn" onClick={enrichSelected} disabled={!selectedId}>Caption + hashtags for selected</button>
            <button className="btn success" onClick={enrichAll} disabled={!plan.length}>Caption + hashtags for all</button>
            <button className="btn" onClick={exportCSV} disabled={!plan.length}>Export CSV</button>
          </div>
        </div>

        <div className="card">
          <h3>Suggested KPIs</h3>
          <div className="kpis">
            <div className="kpi"><div className="small">Posts/week</div><div className="value">{input.postsPerWeek}</div></div>
            <div className="kpi"><div className="small">Ideas</div><div className="value">{plan.length}</div></div>
            <div className="kpi"><div className="small">Pillars</div><div className="value">{normalizeList(input.pillars).length}</div></div>
            <div className="kpi"><div className="small">Tone</div><div className="value">{input.tone}</div></div>
          </div>
          <hr/>
          {!selected ? (
            <div className="small">Select a post from the list to see details.</div>
          ) : (
            <div>
              <div className="small">Date: {selected.date} ? Format: {selected.format} ? Pillar: {selected.pillar}</div>
              <h4 style={{marginTop:8}}>Idea:</h4>
              <div className="mono" style={{whiteSpace:'pre-wrap'}}>{selected.idea}</div>
              {selected.caption && (
                <>
                  <h4 style={{marginTop:12}}>Ready-to-post caption:</h4>
                  <div className="mono" style={{whiteSpace:'pre-wrap'}}>{selected.caption}</div>
                  <div className="footer">
                    <span className="small">Hashtags: {(selected.hashtags||[]).map(h=>`#${h}`).join(' ')}</span>
                    <span className="copy" onClick={()=>copy(selected.caption! + '\n\n' + (selected.hashtags||[]).map(h=>`#${h}`).join(' '))}>Copy caption</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>30-day plan</h3>
        <div className="list">
          {plan.map(p => (
            <div key={p.id} className="item" onClick={()=>setSelectedId(p.id)} style={{borderColor: selectedId===p.id? 'rgba(124,58,237,.6)':'rgba(148,163,184,.2)'}}>
              <div>
                <div className="small">{p.date} ? {p.format} ? {p.pillar}</div>
                <h4>{p.idea.replace(/\(.*\)$/,'').trim()}</h4>
              </div>
              <div className="btns">
                <button className="btn" onClick={(e)=>{e.stopPropagation(); setSelectedId(p.id); enrichSelected();}}>Generate caption</button>
                {p.caption && <button className="btn" onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(p.caption!);}}>Copy</button>}
              </div>
            </div>
          ))}
          {!plan.length && <div className="small">Generate the plan to get started.</div>}
        </div>
      </div>
    </div>
  );
}
