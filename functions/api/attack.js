const COLLECTIONS = {
  enterprise: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
  mobile: 'x-mitre-collection--dac0d2d7-8653-445c-9bff-82f934c1e858',
  ics: 'x-mitre-collection--90c00720-636b-4485-b342-8751d232bf09'
};
const TAXII = 'https://attack-taxii.mitre.org/api/v21/collections/';
const JSON_HEADERS = { Accept: 'application/taxii+json;version=2.1' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function externalId(object) {
  return object.external_references?.find(reference => reference.source_name === 'mitre-attack')?.external_id || '';
}

function compact(object) {
  return {
    id: externalId(object), name: object.name, description: object.description || '',
    tactics: (object.kill_chain_phases || []).map(phase => phase.phase_name),
    platforms: object.x_mitre_platforms || [], subtechnique: Boolean(object.x_mitre_is_subtechnique),
    version: object.x_mitre_version || '', modified: object.modified || ''
  };
}

async function techniques(domain, env) {
  const key = `attack-patterns:${domain}:v1`;
  const cached = await env.ATTACK_CACHE?.get(key, 'json');
  if (cached) return cached;
  const objects = [];
  let next = '';
  do {
    const url = new URL(`${TAXII}${COLLECTIONS[domain]}/objects/`);
    url.searchParams.set('match[type]', 'attack-pattern');
    url.searchParams.set('limit', '1000');
    if (next) url.searchParams.set('next', next);
    const response = await fetch(url, { headers: JSON_HEADERS });
    if (!response.ok) throw new Error('ATTACK_UPSTREAM');
    const page = await response.json();
    objects.push(...(page.objects || []).filter(object => !object.revoked && !object.x_mitre_deprecated).map(compact));
    next = page.more ? page.next : '';
  } while (next);
  const value = { fetchedAt: new Date().toISOString(), techniques: objects };
  await env.ATTACK_CACHE?.put(key, JSON.stringify(value), { expirationTtl: 86400 });
  return value;
}

async function sigmaRules(techniqueId, token) {
  if (!token) return { available: false, reason: 'not-configured', rules: [] };
  if (!/^T\d{4}(?:\.\d{3})?$/i.test(techniqueId)) return { available: false, reason: 'not-applicable', rules: [] };
  const search = new URL('https://api.github.com/search/code');
  search.searchParams.set('q', `repo:SigmaHQ/sigma attack.${techniqueId.toLowerCase()} extension:yml`);
  search.searchParams.set('per_page', '10');
  const response = await fetch(search, { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` } });
  if (!response.ok) return { available: false, reason: `github-${response.status}`, rules: [] };
  const result = await response.json();
  return { available: true, reason: '', rules: (result.items || []).map(item => ({ name: item.name, path: item.path, url: item.html_url })) };
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const domain = url.searchParams.get('domain') || 'enterprise';
  const query = (url.searchParams.get('q') || '').trim();
  if (!COLLECTIONS[domain] || !query || query.length > 80 || !/^[\p{L}\d ._-]*$/u.test(query)) return json({ error: 'Introduce una técnica, sub-técnica o término válido.' }, 400);
  if (!context.env.ATTACK_CACHE) return json({ error: 'El catálogo ATT&CK está pendiente de configurar su caché de Cloudflare.' }, 503);
  try {
    const data = await techniques(domain, context.env);
    const normalized = query.toLocaleLowerCase('en');
    const matched = data.techniques.filter(technique => !normalized || [technique.id, technique.name, ...technique.tactics, ...technique.platforms].join(' ').toLocaleLowerCase('en').includes(normalized)).slice(0, 50);
    const exact = matched.find(technique => technique.id.toLowerCase() === normalized);
    return json({ domain, fetchedAt: data.fetchedAt, techniques: matched, sigma: await sigmaRules(exact?.id || '', context.env.SIGMA_GITHUB_TOKEN) });
  } catch {
    return json({ error: 'La fuente ATT&CK no está disponible ahora.' }, 503);
  }
}
