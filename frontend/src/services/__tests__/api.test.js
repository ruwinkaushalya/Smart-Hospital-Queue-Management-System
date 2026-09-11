import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../services/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Patient APIs', () => {
    it('getPatients fetches from correct URL', async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: 'P1' }]));
      const result = await api.getPatients();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/patients'), expect.anything());
      expect(result).toEqual([{ id: 'P1' }]);
    });

    it('getEmergencyPatients fetches emergency patients', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getEmergencyPatients();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/patients/emergency'), expect.anything());
    });

    it('getNormalPatients fetches normal queue patients', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getNormalPatients();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/patients/normal'), expect.anything());
    });

    it('createPatient sends POST with patient data', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'P1' }, 201));
      const patient = { name: 'Test', age: '30', contact: '123' };
      await api.createPatient(patient);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/patients'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(patient),
        })
      );
    });
  });

  describe('Queue Operations', () => {
    it('getQueueStatus fetches queue stats', async () => {
      mockFetch.mockResolvedValue(mockResponse({ totalWaiting: 5 }));
      const result = await api.getQueueStatus();
      expect(result.totalWaiting).toBe(5);
    });

    it('processNextPatient sends POST', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));
      await api.processNextPatient();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queues/process-next'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('simulateEmergency sends POST', async () => {
      mockFetch.mockResolvedValue(mockResponse({ name: 'Emergency' }));
      await api.simulateEmergency();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queues/simulate-emergency'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('clearQueue sends POST', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));
      await api.clearQueue();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queues/clear'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Hospital and Network APIs', () => {
    it('getHospitals fetches hospitals', async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: 'H1' }]));
      const result = await api.getHospitals();
      expect(result).toEqual([{ id: 'H1' }]);
    });

    it('getRoads fetches road network', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getRoads();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/roads'), expect.anything());
    });

    it('getAmbulances fetches ambulances', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getAmbulances();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/ambulances'), expect.anything());
    });

    it('getShortestPath passes query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ path: ['H1', 'H2'] }));
      await api.getShortestPath('H1', 'H5');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('from=H1&to=H5'),
        expect.anything()
      );
    });
  });

  describe('Bed Management APIs', () => {
    it('allocateBed sends POST with hospitalId and bedType', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));
      await api.allocateBed('H1', 'GENERAL');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/beds/allocate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ hospitalId: 'H1', bedType: 'GENERAL' }),
        })
      );
    });

    it('dischargeBed sends POST', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));
      await api.dischargeBed('H1', 'ICU');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/beds/discharge'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ hospitalId: 'H1', bedType: 'ICU' }),
        })
      );
    });
  });

  describe('Auth APIs', () => {
    it('login sends POST with credentials', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));
      await api.login('admin', 'admin123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        })
      );
    });

    it('logout sends POST with token', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));
      await api.logout('token123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'token123' }),
        })
      );
    });

    it('getMe sends GET with Authorization header', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: '1' }));
      await api.getMe('token123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      );
    });
  });

  describe('Medication APIs', () => {
    it('getMedications fetches all medications', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getMedications();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/medications'), expect.anything());
    });

    it('getLowStockMedications fetches low stock', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getLowStockMedications();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/medications/low-stock'), expect.anything());
    });

    it('searchMedications passes query param', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.searchMedications('Aspirin');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('name=Aspirin'),
        expect.anything()
      );
    });
  });

  describe('Invoice APIs', () => {
    it('getInvoices fetches invoices', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getInvoices();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/invoices'), expect.anything());
    });

    it('getRevenueAnalytics fetches revenue data', async () => {
      mockFetch.mockResolvedValue(mockResponse({ totalRevenue: 5000 }));
      const result = await api.getRevenueAnalytics();
      expect(result.totalRevenue).toBe(5000);
    });
  });

  describe('Error Handling', () => {
    it('throws error for non-OK responses', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'Not found' }, 404));
      await expect(api.getPatients()).rejects.toThrow('404');
    });

    it('throws network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      await expect(api.getPatients()).rejects.toThrow('Network error');
    });
  });

  describe('Mock Data Helpers', () => {
    it('getHourlyVolume returns mock data', async () => {
      const result = await api.getHourlyVolume();
      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('hour');
      expect(result[0]).toHaveProperty('emergency');
    });

    it('getWaitTimeTrend returns mock data', async () => {
      const result = await api.getWaitTimeTrend();
      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('day');
      expect(result[0]).toHaveProperty('avgWait');
    });
  });
});
