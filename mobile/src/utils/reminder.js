export function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function nextOccurrence(horario, now = new Date()) {
  if (!isValidTime(horario)) throw new Error('Informe um horário válido no formato HH:mm.');
  const [hour, minute] = horario.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export function reminderFields({ enabled, horario, repeats, completed, original, reschedule = false }, now = new Date()) {
  if (!enabled) return { horario: null, lembrete_em: null, repetir_diariamente: false };
  const unchanged = original?.horario === horario && Boolean(original?.repetir_diariamente) === repeats
    && original?.lembrete_em && !reschedule && !(original?.concluida && !completed);
  return {
    horario,
    lembrete_em: unchanged ? original.lembrete_em : nextOccurrence(horario, now),
    repetir_diariamente: repeats,
  };
}

export function reminderLabel(task) {
  if (!task.horario) return 'Sem despertador';
  if (task.concluida) return `${task.horario} · despertador desativado`;
  if (task.repetir_diariamente) return `${task.horario} · todos os dias`;
  const date = new Date(task.lembrete_em);
  if (!Number.isFinite(date.getTime())) return task.horario;
  return `${task.horario} · ${date.toLocaleDateString('pt-BR')}${date.getTime() <= Date.now() ? ' · horário passado' : ''}`;
}
