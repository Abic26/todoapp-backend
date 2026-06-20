const chrono = require('chrono-node');

const spanishWeekdays = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
};

const parseHour = (text) => {
  const match = text.match(
    /(?:a\s+las?\s+)(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?\s*m\.?|p\.?\s*m\.?)?|(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?\s*m\.?|p\.?\s*m\.?)/i,
  );
  if (!match) return { hour: 9, minute: 0 };

  let hour = Number(match[1] || match[4]);
  const minute = Number(match[2] || match[5] || 0);
  const meridiem = (match[3] || match[6] || '').replace(/[\s.]/g, '').toLowerCase();
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return { hour, minute };
};

const parseSpanishDate = (text, referenceDate = new Date()) => {
  const normalized = text.toLowerCase();
  const { hour, minute } = parseHour(normalized);
  const result = new Date(referenceDate);
  result.setSeconds(0, 0);

  if (normalized.includes('pasado mañana') || normalized.includes('pasado manana')) {
    result.setDate(result.getDate() + 2);
    result.setHours(hour, minute, 0, 0);
    return result;
  }

  if (normalized.includes('mañana') || normalized.includes('manana')) {
    result.setDate(result.getDate() + 1);
    result.setHours(hour, minute, 0, 0);
    return result;
  }

  for (const [name, day] of Object.entries(spanishWeekdays)) {
    if (normalized.includes(name)) {
      let daysAhead = (day - result.getDay() + 7) % 7;
      if (daysAhead === 0) daysAhead = 7;
      result.setDate(result.getDate() + daysAhead);
      result.setHours(hour, minute, 0, 0);
      return result;
    }
  }

  const parsed = chrono.es.casual.parseDate(text, referenceDate, { forwardDate: true });
  return parsed || null;
};

module.exports = { parseSpanishDate };
