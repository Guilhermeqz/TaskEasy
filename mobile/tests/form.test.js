import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import TaskForm from '../src/components/TaskForm';
jest.mock('../src/services/alarms', () => ({ alarmsAvailable: false }));

test('formulário não envia título vazio e preserva os dados ao falhar o salvamento', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('Falha de conexão'));
  const view = await render(<PaperProvider settings={{ icon: () => null }}><TaskForm onSave={onSave} /></PaperProvider>);
  await act(async () => { fireEvent.press(view.getByText('Salvar tarefa')); });
  expect(onSave).not.toHaveBeenCalled();
  expect(view.getByText('O título é obrigatório.')).toBeTruthy();
  await fireEvent.changeText(view.getByLabelText('Título'), 'Estudar');
  await fireEvent.changeText(view.getByLabelText('Descrição (opcional)'), 'Revisar anotações');
  await act(async () => { fireEvent.press(view.getByText('Salvar tarefa')); });
  expect(await view.findByText('Falha de conexão')).toBeTruthy();
  expect(view.getByDisplayValue('Estudar')).toBeTruthy();
  expect(onSave).toHaveBeenCalledWith({ titulo: 'Estudar', descricao: 'Revisar anotações', concluida: false,
    horario: null, lembrete_em: null, repetir_diariamente: false });
});

test('formulário salva o horário do café e rejeita um horário inválido', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const view = await render(<PaperProvider settings={{ icon: () => null }}><TaskForm onSave={onSave} /></PaperProvider>);
  await fireEvent.changeText(view.getByLabelText('Título'), 'Tomar café');
  await fireEvent(view.getByLabelText('Ativar despertador por horário'), 'valueChange', true);
  await fireEvent.changeText(view.getByLabelText('Horário'), '25:00');
  await act(async () => { fireEvent.press(view.getByText('Salvar tarefa')); });
  expect(onSave).not.toHaveBeenCalled();
  expect(view.getByText('Use um horário de 00:00 a 23:59, como 09:00.')).toBeTruthy();
  await fireEvent.changeText(view.getByLabelText('Horário'), '09:00');
  await act(async () => { fireEvent.press(view.getByText('Salvar tarefa')); });
  const values = onSave.mock.calls[0][0];
  expect(values.horario).toBe('09:00');
  expect(Date.parse(values.lembrete_em)).toBeGreaterThan(Date.now());
  expect(values.repetir_diariamente).toBe(false);
});
