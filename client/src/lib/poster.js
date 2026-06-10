import { LEVELS, levelById } from './levels.js';

const POSTER_SIZES = {
  a4: { label: 'A4', width: 2480, height: 3508 },
  a3: { label: 'A3', width: 3508, height: 4961 },
};

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function truncate(value, max) {
  const text = String(value ?? '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trim()}...`;
}

function wrapText(value, maxChars, maxLines) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word.length > maxChars ? truncate(word, maxChars) : word;
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = truncate(lines[maxLines - 1], Math.max(8, maxChars - 3));
  }

  return lines.length ? lines : ['Untitled decision'];
}

function textBlock(lines, x, y, options = {}) {
  const {
    size = 42,
    weight = 500,
    fill = '#111827',
    lineHeight = Math.round(size * 1.28),
    anchor = 'start',
  } = options;

  return lines.map((line, index) => (
    `<text x="${x}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(line)}</text>`
  )).join('');
}

function voteCounts(votes) {
  const counts = new Map(LEVELS.map(level => [level.level, 0]));
  for (const vote of votes ?? []) {
    if (counts.has(vote.choice)) counts.set(vote.choice, counts.get(vote.choice) + 1);
  }
  return counts;
}

function consensusLevel(votes) {
  const choices = (votes ?? []).map(v => v.choice).filter(choice => choice !== null && choice !== undefined);
  if (!choices.length) return null;
  return new Set(choices).size === 1 ? choices[0] : null;
}

function posterEntries(session) {
  return (session.history ?? []).filter(entry => entry.decision?.level);
}

function cardLayout(count, sizeKey) {
  if (count <= 2) return { columns: 1, mode: 'cards' };
  if (count <= 6) return { columns: 2, mode: 'cards' };
  if (count <= 12) return { columns: sizeKey === 'a3' ? 3 : 2, mode: 'cards' };
  return { columns: 1, mode: 'table' };
}

function renderVoteBars(votes, x, y, width, height) {
  const counts = voteCounts(votes);
  const max = Math.max(1, ...counts.values());
  const gap = 14;
  const itemWidth = (width - gap * 6) / 7;

  return LEVELS.map((level, index) => {
    const count = counts.get(level.level) ?? 0;
    const barHeight = Math.max(8, (count / max) * (height - 54));
    const itemX = x + index * (itemWidth + gap);
    const barY = y + height - 30 - barHeight;
    return `
      <rect x="${itemX}" y="${barY}" width="${itemWidth}" height="${barHeight}" rx="7" fill="${level.color}" opacity="${count ? 0.9 : 0.18}" />
      <text x="${itemX + itemWidth / 2}" y="${y + height - 2}" font-size="24" font-weight="800" fill="#111827" text-anchor="middle">${level.level}</text>
      <text x="${itemX + itemWidth / 2}" y="${barY - 10}" font-size="24" font-weight="700" fill="#374151" text-anchor="middle">${count}</text>
    `;
  }).join('');
}

function renderCard(entry, x, y, width, height, density) {
  const level = levelById(entry.decision.level);
  const consensus = consensusLevel(entry.votes);
  const padding = density === 'compact' ? 34 : 46;
  const titleSize = density === 'compact' ? 34 : 42;
  const bodySize = density === 'compact' ? 25 : 31;
  const scenarioLines = wrapText(entry.scenario || `Round ${entry.round}`, density === 'compact' ? 42 : 48, density === 'compact' ? 2 : 3);
  const notesLines = wrapText(entry.decision.notes || 'No notes recorded.', density === 'compact' ? 48 : 56, density === 'compact' ? 2 : 3);

  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="#ffffff" stroke="#d1d5db" stroke-width="4" />
      <rect x="${x}" y="${y}" width="${width}" height="18" rx="9" fill="${level.color}" />
      <text x="${x + padding}" y="${y + padding + 8}" font-size="25" font-weight="800" fill="#6b7280">ROUND ${entry.round}</text>
      ${textBlock(scenarioLines, x + padding, y + padding + 60, { size: titleSize, weight: 800, lineHeight: Math.round(titleSize * 1.22) })}

      <rect x="${x + padding}" y="${y + height * 0.36}" width="${width - padding * 2}" height="${density === 'compact' ? 108 : 132}" rx="20" fill="${level.color}" opacity="0.11" />
      <circle cx="${x + padding + 58}" cy="${y + height * 0.36 + (density === 'compact' ? 54 : 66)}" r="${density === 'compact' ? 36 : 44}" fill="${level.color}" />
      <text x="${x + padding + 58}" y="${y + height * 0.36 + (density === 'compact' ? 67 : 82)}" font-size="${density === 'compact' ? 46 : 56}" font-weight="900" fill="#ffffff" text-anchor="middle">${level.level}</text>
      <text x="${x + padding + 122}" y="${y + height * 0.36 + 50}" font-size="${density === 'compact' ? 34 : 40}" font-weight="900" fill="#111827">${escapeXml(level.name)}</text>
      <text x="${x + padding + 122}" y="${y + height * 0.36 + 88}" font-size="${bodySize}" font-weight="500" fill="#374151">${escapeXml(level.desc)}</text>

      <text x="${x + padding}" y="${y + height * 0.61}" font-size="${bodySize}" font-weight="800" fill="#6b7280">VOTE SPREAD</text>
      ${renderVoteBars(entry.votes, x + padding, y + height * 0.63, width - padding * 2, density === 'compact' ? 120 : 150)}

      <text x="${x + padding}" y="${y + height - (density === 'compact' ? 105 : 136)}" font-size="${bodySize}" font-weight="800" fill="#6b7280">NOTES</text>
      ${textBlock(notesLines, x + padding, y + height - (density === 'compact' ? 70 : 94), { size: bodySize, weight: 500, fill: '#374151', lineHeight: Math.round(bodySize * 1.3) })}
      <text x="${x + width - padding}" y="${y + height - 36}" font-size="${density === 'compact' ? 22 : 25}" font-weight="700" fill="${consensus === entry.decision.level ? '#047857' : '#6b7280'}" text-anchor="end">
        ${consensus === entry.decision.level ? 'Consensus decision' : consensus ? `Consensus was level ${consensus}` : 'Discussed decision'}
      </text>
    </g>
  `;
}

function renderTable(entries, x, y, width, height) {
  const rowHeight = Math.floor(height / Math.max(entries.length, 1));
  const scale = Math.max(0.58, Math.min(1, rowHeight / 160));
  const scenarioWidth = Math.floor(width * 0.38);
  const notesWidth = Math.floor(width * 0.34);
  const roundSize = Math.round(32 * scale);
  const headingSize = Math.round(28 * scale);
  const bodySize = Math.round(22 * scale);
  const noteSize = Math.round(25 * scale);
  const circleRadius = Math.round(36 * scale);
  const scenarioLinesMax = rowHeight < 105 ? 1 : 2;
  const notesLinesMax = rowHeight < 105 ? 1 : 2;

  return entries.map((entry, index) => {
    const rowY = y + index * rowHeight;
    const level = levelById(entry.decision.level);
    const scenarioLines = wrapText(entry.scenario || `Round ${entry.round}`, 44, scenarioLinesMax);
    const notesLines = wrapText(entry.decision.notes || 'No notes recorded.', 42, notesLinesMax);
    const counts = voteCounts(entry.votes);
    const spread = LEVELS.map(l => `${l.level}:${counts.get(l.level) ?? 0}`).join('  ');

    return `
      <g>
        <rect x="${x}" y="${rowY}" width="${width}" height="${Math.max(42, rowHeight - 10)}" rx="18" fill="#ffffff" stroke="#d1d5db" stroke-width="3" />
        <rect x="${x}" y="${rowY}" width="18" height="${Math.max(42, rowHeight - 10)}" rx="9" fill="${level.color}" />
        <text x="${x + 48}" y="${rowY + Math.round(rowHeight * 0.48)}" font-size="${roundSize}" font-weight="900" fill="#111827">R${entry.round}</text>
        ${textBlock(scenarioLines, x + 130, rowY + Math.round(rowHeight * 0.38), { size: headingSize, weight: 800, lineHeight: Math.round(36 * scale) })}
        <circle cx="${x + scenarioWidth + 188}" cy="${rowY + Math.round(rowHeight * 0.43)}" r="${circleRadius}" fill="${level.color}" />
        <text x="${x + scenarioWidth + 188}" y="${rowY + Math.round(rowHeight * 0.43) + Math.round(13 * scale)}" font-size="${Math.round(44 * scale)}" font-weight="900" fill="#ffffff" text-anchor="middle">${level.level}</text>
        <text x="${x + scenarioWidth + 242}" y="${rowY + Math.round(rowHeight * 0.36)}" font-size="${Math.round(30 * scale)}" font-weight="900" fill="#111827">${escapeXml(level.name)}</text>
        <text x="${x + scenarioWidth + 242}" y="${rowY + Math.round(rowHeight * 0.64)}" font-size="${bodySize}" font-weight="600" fill="#6b7280">${escapeXml(spread)}</text>
        ${textBlock(notesLines, x + width - notesWidth, rowY + Math.round(rowHeight * 0.38), { size: noteSize, weight: 500, fill: '#374151', lineHeight: Math.round(34 * scale) })}
      </g>
    `;
  }).join('');
}

export async function downloadDecisionPoster(session, sizeKey = 'a3') {
  const size = POSTER_SIZES[sizeKey] ?? POSTER_SIZES.a3;
  const entries = posterEntries(session);
  if (!entries.length) throw new Error('Save at least one decision before downloading a poster.');

  const generatedAt = new Date();
  const margin = Math.round(size.width * 0.055);
  const headerHeight = Math.round(size.height * 0.13);
  const contentY = margin + headerHeight;
  const contentHeight = size.height - contentY - margin;
  const layout = cardLayout(entries.length, sizeKey);
  const gap = entries.length > 8 ? 28 : 38;

  let content;
  if (layout.mode === 'table') {
    content = renderTable(entries, margin, contentY, size.width - margin * 2, contentHeight);
  } else {
    const rows = Math.ceil(entries.length / layout.columns);
    const cardWidth = (size.width - margin * 2 - gap * (layout.columns - 1)) / layout.columns;
    const cardHeight = (contentHeight - gap * (rows - 1)) / rows;
    const density = entries.length > 6 || cardHeight < 780 ? 'compact' : 'normal';
    content = entries.map((entry, index) => {
      const column = index % layout.columns;
      const row = Math.floor(index / layout.columns);
      return renderCard(
        entry,
        margin + column * (cardWidth + gap),
        contentY + row * (cardHeight + gap),
        cardWidth,
        cardHeight,
        density
      );
    }).join('');
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
      <rect width="100%" height="100%" fill="#f8fafc" />
      <text x="${margin}" y="${margin + 76}" font-size="${sizeKey === 'a3' ? 96 : 76}" font-weight="900" fill="#111827">Delegation Decisions</text>
      <text x="${margin}" y="${margin + 132}" font-size="${sizeKey === 'a3' ? 38 : 31}" font-weight="700" fill="#4b5563">
        Session ${escapeXml(session.id)} / ${entries.length} saved decision${entries.length === 1 ? '' : 's'} / Generated ${escapeXml(generatedAt.toLocaleDateString())}
      </text>
      <text x="${size.width - margin}" y="${margin + 132}" font-size="${sizeKey === 'a3' ? 34 : 28}" font-weight="800" fill="#6b7280" text-anchor="end">${size.label} poster</text>
      <line x1="${margin}" y1="${margin + headerHeight - 28}" x2="${size.width - margin}" y2="${margin + headerHeight - 28}" stroke="#d1d5db" stroke-width="4" />
      ${content}
      <text x="${size.width - margin}" y="${size.height - 34}" font-size="24" font-weight="700" fill="#9ca3af" text-anchor="end">Delegation Poker</text>
    </svg>
  `;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not render the poster image.'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not export poster PNG.')), 'image/png');
    });
    const downloadUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `delegation-decisions-${session.id}-${sizeKey}.png`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}
