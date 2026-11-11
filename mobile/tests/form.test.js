import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import TaskForm from '../src/components/TaskForm';

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
  expect(onSave).toHaveBeenCalledWith({ titulo: 'Estudar', descricao: 'Revisar anotações', concluida: false });
});
