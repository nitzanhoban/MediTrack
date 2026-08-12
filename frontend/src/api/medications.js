import { api } from './client';

export const listMedications = (department) =>
  api.get('/medications', { params: department ? { department } : {} }).then((res) => res.data.medications);

export const listDepartments = () =>
  api.get('/medications/departments').then((res) => res.data.departments);

export const listAlerts = () => api.get('/medications/alerts').then((res) => res.data.alerts);

export const createMedication = (payload) =>
  api.post('/medications', payload).then((res) => res.data.medication);

export const deleteMedication = (medicationId) =>
  api.delete(`/medications/${medicationId}`).then((res) => res.data);

export const withdrawMedication = (medicationId, quantity, department) =>
  api
    .post(`/medications/${medicationId}/withdraw`, { quantity, department })
    .then((res) => res.data.medication);

export const restockMedication = (medicationId, quantity, department) =>
  api
    .post(`/medications/${medicationId}/restock`, { quantity, department })
    .then((res) => res.data.medication);
