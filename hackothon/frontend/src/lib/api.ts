import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Auto-attach auth token to all requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('iccip_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// ---- Disease Predictions ----
export const predictHeart = (data: any) => api.post('/api/predict/heart', data);
export const predictKidney = (data: any) => api.post('/api/predict/kidney', data);
export const predictStroke = (data: any) => api.post('/api/predict/stroke', data);
export const predictDiabetes = (data: any) => api.post('/api/predict/diabetes', data);
export const predictThyroid = (data: any) => api.post('/api/predict/thyroid', data);
export const predictBrain = (file: File, modelName: string = 'DenseNet-121') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);
    return api.post('/api/predict/brain', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const predictComprehensive = (data: any) => api.post('/api/predict/comprehensive', data);

// ---- Gemini AI ----
export const chatWithAI = (message: string, patientId?: string, imageBase64?: string) =>
    api.post('/api/ai/chat', { message, patient_id: patientId, image_base64: imageBase64 });
export const getAIExplanation = (predictions: any, patientName?: string) =>
    api.post('/api/ai/explain', { predictions, patient_name: patientName });
export const getDietPlan = (predictions: any, patientInfo?: any) =>
    api.post('/api/ai/diet-plan', { predictions, patient_info: patientInfo });

// ---- Doctor Search (Google Maps) ----
export const searchDoctors = (latitude: number, longitude: number, condition: string, radius?: number) =>
    api.post('/api/doctors/search', { latitude, longitude, condition, radius: radius || 10000 });

// ---- Reports ----
export const downloadReport = (patientId: string) =>
    api.get(`/api/report/${patientId}`, { responseType: 'blob' });
export const generateReport = (data: any) =>
    api.post('/api/report/generate', data);

// ---- WhatsApp ----
export const sendWhatsApp = (patientId: string, phoneNumber: string) =>
    api.post('/api/whatsapp/send', { patient_id: patientId, phone_number: phoneNumber });

// ---- Vitals ----
export const recordVitals = (data: any) => api.post('/api/vitals', data);
export const getVitals = (patientId: string) => api.get(`/api/vitals/${patientId}`);

// ---- Patients ----
export const createPatient = (data: any) => api.post('/api/patients', data);
export const listPatients = () => api.get('/api/patients');
export const getPatient = (id: string) => api.get(`/api/patients/${id}`);
export const getPatientPredictions = (id: string) => api.get(`/api/patients/${id}/predictions`);

// ---- Dashboard ----
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// ---- Health ----
export const healthCheck = () => api.get('/api/health');

// ---- Medications ----
export const getMedications = (patientId: string) => api.get(`/api/medications/${patientId}`);
export const addMedication = (data: any) => api.post('/api/medications', data);

// ---- Care Plan ----
export const getCarePlan = (patientId: string) => api.get(`/api/careplan/${patientId}`);

// ---- Auth ----
export const loginUser = (email: string, password: string) =>
    api.post('/api/auth/login', { email, password });
export const registerUser = (name: string, email: string, password: string, phone?: string) =>
    api.post('/api/auth/register', { name, email, password, phone });
export const getMe = (token: string) =>
    api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });

// ---- User (authenticated) ----
export const getUserHistory = (token: string) =>
    api.get('/api/user/history', { headers: { Authorization: `Bearer ${token}` } });
export const userPredict = (token: string, disease: string, data: any) =>
    api.post(`/api/user/predict/${disease}`, data, { headers: { Authorization: `Bearer ${token}` } });

// ---- Admin ----
export const adminGetUsers = (token: string) =>
    api.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
export const adminGetUserDetail = (token: string, userId: string) =>
    api.get(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
export const adminDeleteUser = (token: string, userId: string) =>
    api.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
export const adminGetStats = (token: string) =>
    api.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
export const adminGetPredictions = (token: string) =>
    api.get('/api/admin/predictions', { headers: { Authorization: `Bearer ${token}` } });

export default api;
