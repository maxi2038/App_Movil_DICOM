import axios from 'axios';

// URL de producción en Render
const API_BASE_URL = 'https://api-dicom-movil.onrender.com/api'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});