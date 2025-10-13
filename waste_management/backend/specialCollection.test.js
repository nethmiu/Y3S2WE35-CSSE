const request = require('supertest');
const express = require('express');
const specialCollectionRoutes = require('./routes/specialCollectionRoutes');
const SpecialCollection = require('./models/specialCollectionModel');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api/collections', specialCollectionRoutes);

// Mocking the SpecialCollection model
jest.mock('./models/specialCollectionModel');

// =================== Test Suite for Special Collections ===================
describe('Special Collection API', () => {

    // mock reset before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------ Testing GET /api/collections/availability ------------------
    describe('GET /availability', () => {
        
        it('should return available time slots for a given date (Positive Case)', async () => {
            SpecialCollection.find.mockResolvedValue([{ timeSlot: '8:00 AM - 11:00 AM' }]);
            const response = await request(app).get('/api/collections/availability?date=2025-12-25');
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(3);
        });

        it('should return an empty array when no slots are available (Negative Case)', async () => {
            const fullBookings = [
                ...Array(5).fill({ timeSlot: '8:00 AM - 11:00 AM' }),
                ...Array(5).fill({ timeSlot: '11:00 AM - 2:00 PM' }),
                ...Array(5).fill({ timeSlot: '2:00 PM - 5:00 PM' }),
            ];
            SpecialCollection.find.mockResolvedValue(fullBookings);
            const response = await request(app).get('/api/collections/availability?date=2025-12-26');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return a 400 error if date is not provided (Edge/Error Case)', async () => {
            const response = await request(app).get('/api/collections/availability');
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('Date is required');
        });

        it('should return a 500 error if the database query fails (Error Case)', async () => {
            SpecialCollection.find.mockRejectedValue(new Error('Database error'));
            const response = await request(app).get('/api/collections/availability?date=2025-12-25');
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe('Server Error');
        });
    });

    // ------------------ Testing POST /api/collections ------------------
    describe('POST /', () => {

        const newScheduleData = {
            userId: '60d0fe4f5311236168a109ca',
            date: '2025-12-25',
            timeSlot: '8:00 AM - 11:00 AM',
            wasteType: 'E-Waste',
            location: { latitude: 6.9271, longitude: 79.8612 },
            weight: 10,
            totalAmount: 1200,
            remarks: 'Test remark'
        };

        it('should create a new schedule with valid data (Positive Case)', async () => {
            SpecialCollection.prototype.save = jest.fn().mockResolvedValue(newScheduleData);
            const response = await request(app).post('/api/collections').send(newScheduleData);
            expect(response.statusCode).toBe(201);
            expect(response.body.wasteType).toBe('E-Waste');
        });

        it('should return a 400 error if a required field is missing (Negative Case)', async () => {
            const { timeSlot, ...incompleteData } = newScheduleData;
            const response = await request(app).post('/api/collections').send(incompleteData);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('Please provide all required fields');
        });

        it('should return a 500 error if saving to the database fails (Error Case)', async () => {
            SpecialCollection.prototype.save = jest.fn().mockRejectedValue(new Error('Save error'));
            const response = await request(app).post('/api/collections').send(newScheduleData);
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe('Failed to create schedule');
        });
    });

    // ------------------ Testing GET /api/collections/all ------------------
    describe('GET /all', () => {

        it('should return all schedules successfully (Positive Case)', async () => {
            const mockSchedules = [ { user: { email: 'user1@example.com' } }, { user: { email: 'user2@example.com' } }];
            const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(mockSchedules) };
            SpecialCollection.find.mockReturnValue(mockQuery);
            const response = await request(app).get('/api/collections/all');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockSchedules);
            expect(SpecialCollection.find).toHaveBeenCalledWith({});
            expect(mockQuery.populate).toHaveBeenCalledWith('user', 'email');
            expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
        });
    
        it('should return a 500 error if fetching all schedules fails (Error Case)', async () => {
            const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockRejectedValue(new Error('Database fetch error')) };
            SpecialCollection.find.mockReturnValue(mockQuery);
            const response = await request(app).get('/api/collections/all');
            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe('Server Error');
        });
    });

   
    // ------------------ Testing GET /api/collections/my-schedules/:userId ------------------
    describe('GET /my-schedules/:userId', () => {

        const userId = '60d0fe4f5311236168a109ca';

        it('should return schedules for a specific user (Positive Case)', async () => {
            const mockUserSchedules = [ { user: userId, date: '2025-10-10' }, { user: userId, date: '2025-10-09' }];
            const mockQuery = { sort: jest.fn().mockResolvedValue(mockUserSchedules) };
            SpecialCollection.find.mockReturnValue(mockQuery);

            const response = await request(app).get(`/api/collections/my-schedules/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockUserSchedules);
            expect(SpecialCollection.find).toHaveBeenCalledWith({ user: userId });
            expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
        });

        it('should return a 500 error if fetching user schedules fails (Error Case)', async () => {
            const mockQuery = { sort: jest.fn().mockRejectedValue(new Error('DB error')) };
            SpecialCollection.find.mockReturnValue(mockQuery);

            const response = await request(app).get(`/api/collections/my-schedules/${userId}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe('Server Error');
        });
    });
});
