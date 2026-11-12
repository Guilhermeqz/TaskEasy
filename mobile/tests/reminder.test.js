import { isValidTime, nextOccurrence, reminderFields } from '../src/utils/reminder';

test('09:00 é agendado hoje ou amanhã usando o horário local do aparelho', () => {
  const before = new Date(2030, 0, 2, 8, 0);
  const today = new Date(nextOccurrence('09:00', before));
  expect(today.getDate()).toBe(2);
  expect(today.getHours()).toBe(9);
  const after = new Date(2030, 0, 2, 9, 0);
  const tomorrow = new Date(nextOccurrence('09:00', after));
  expect(tomorrow.getDate()).toBe(3);
  expect(tomorrow.getHours()).toBe(9);
});

test('valida formato e limites e avança corretamente para o próximo ano', () => {
  for (const time of ['24:00', '09:60', '9:00', '09', null]) expect(isValidTime(time)).toBe(false);
  expect(isValidTime('00:00')).toBe(true);
  const next = new Date(nextOccurrence('00:00', new Date(2030, 11, 31, 23, 59)));
  expect(next.getFullYear()).toBe(2031);
  expect(next.getMonth()).toBe(0);
});

test('editar apenas o título não rearma um aviso que já tocou; reagendar ou reabrir rearma', () => {
  const original = { horario: '09:00', lembrete_em: '2020-01-01T12:00:00.000Z', repetir_diariamente: false };
  const options = { enabled: true, horario: '09:00', repeats: false, completed: false, original };
  expect(reminderFields(options).lembrete_em).toBe(original.lembrete_em);
  expect(Date.parse(reminderFields({ ...options, reschedule: true }).lembrete_em)).toBeGreaterThan(Date.now());
  expect(Date.parse(reminderFields({ ...options, original: { ...original, concluida: true } }).lembrete_em)).toBeGreaterThan(Date.now());
  expect(reminderFields({ enabled: false })).toEqual({ horario: null, lembrete_em: null, repetir_diariamente: false });
});
