const request = require('supertest');
const express = require('express');
const collectionRoutes = require('./routes/collectionRoutes');
const CollectionSchedule = require('./models/collectionScheduleModel');
const Bin = require('./models/binModel');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api/regular-collections', collectionRoutes);

// Mocking the models
jest.mock('./models/collectionScheduleModel');
jest.mock('./models/binModel');

// =================== Test Suite for Collection Controller ===================
describe('Collection Controller API', () => {

    // Mock reset before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------ Testing POST /api/regular-collections ------------------
    describe('POST /', () => {
        const validCollectionData = {
            userId: '60d0fe4f5311236168a109ca',
            binIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
            scheduledDate: '2025-12-25',
            timeSlot: '8:00 AM - 11:00 AM',
            collectionType: 'regular'
        };

        it('should create a new collection schedule with valid data (Positive Case)', async () => {
            // Mock Bin.find to verify bins exist and belong to user
            const mockBins = [
                { _id: '507f1f77bcf86cd799439011', user: '60d0fe4f5311236168a109ca' },
                { _id: '507f1f77bcf86cd799439012', user: '60d0fe4f5311236168a109ca' }
            ];
            Bin.find.mockResolvedValue(mockBins);

            // Mock the saved collection with populate method
            const mockSavedCollection = {
                _id: '607f1f77bcf86cd799439013',
                ...validCollectionData,
                bins: mockBins,
                populate: jest.fn().mockResolvedValue({
                    _id: '607f1f77bcf86cd799439013',
                    ...validCollectionData,
                    bins: mockBins.map(bin => ({
                        ...bin,
                        binName: 'Test Bin',
                        binType: 'general',
                        capacity: 50,
                        location: { address: '123 Main St' }
                    }))
                })
            };

            // Mock CollectionSchedule constructor and save
            CollectionSchedule.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(mockSavedCollection)
            }));

            const response = await request(app)
                .post('/api/regular-collections')
                .send(validCollectionData);

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Bin.find).toHaveBeenCalledWith({
                _id: { $in: validCollectionData.binIds },
                user: validCollectionData.userId
            });
        });

        it('should return 400 if required fields are missing (Negative Case)', async () => {
            const { userId, ...incompleteData } = validCollectionData;
            const response = await request(app)
                .post('/api/regular-collections')
                .send(incompleteData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Please provide all required fields');
        });

        it('should return 400 if binIds is not an array (Negative Case)', async () => {
            const invalidData = { ...validCollectionData, binIds: 'not-an-array' };
            const response = await request(app)
                .post('/api/regular-collections')
                .send(invalidData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('binIds must be a non-empty array');
        });

        it('should return 400 if bins not found or dont belong to user (Negative Case)', async () => {
            Bin.find.mockResolvedValue([{ _id: '507f1f77bcf86cd799439011', user: '60d0fe4f5311236168a109ca' }]);
            
            const response = await request(app)
                .post('/api/regular-collections')
                .send(validCollectionData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('One or more bins not found');
        });

        it('should return 500 if database operation fails (Error Case)', async () => {
            Bin.find.mockResolvedValue([
                { _id: '507f1f77bcf86cd799439011', user: '60d0fe4f5311236168a109ca' },
                { _id: '507f1f77bcf86cd799439012', user: '60d0fe4f5311236168a109ca' }
            ]);

            CollectionSchedule.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Database save error'))
            }));

            const response = await request(app)
                .post('/api/regular-collections')
                .send(validCollectionData);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Error creating collection schedule');
        });
    });

    // ------------------ Testing GET /api/regular-collections ------------------
    describe('GET /', () => {
        it('should return all collections successfully (Positive Case)', async () => {
            const mockCollections = [
                {
                    _id: '1',
                    scheduledDate: '2025-12-25',
                    timeSlot: '8:00 AM - 11:00 AM',
                    user: { email: 'user1@example.com', profile: {} },
                    bins: [{ binName: 'Bin 1', binType: 'general' }]
                }
            ];

            // Properly mock the Mongoose query chain
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockCollections)
            });

            const response = await request(app).get('/api/regular-collections');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockCollections);
            expect(CollectionSchedule.find).toHaveBeenCalledWith({});
        });

        it('should return 500 if fetching collections fails (Error Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app).get('/api/regular-collections');

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Server Error');
        });
    });

    // ------------------ Testing GET /api/regular-collections/user/:userId ------------------
    describe('GET /user/:userId', () => {
        const userId = '60d0fe4f5311236168a109ca';

        it('should return collections for specific user with pagination (Positive Case)', async () => {
            const mockCollections = [
                {
                    _id: '1',
                    user: userId,
                    scheduledDate: '2025-12-25',
                    bins: [{ binName: 'User Bin 1' }]
                }
            ];

            // Mock the query chain properly
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockCollections)
            });
            
            CollectionSchedule.countDocuments.mockResolvedValue(1);

            const response = await request(app)
                .get(`/api/regular-collections/user/${userId}?page=1&limit=10`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockCollections);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
        });

        it('should filter collections by status (Positive Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            });
            CollectionSchedule.countDocuments.mockResolvedValue(0);

            const response = await request(app)
                .get(`/api/regular-collections/user/${userId}?status=completed`);

            expect(response.statusCode).toBe(200);
            expect(CollectionSchedule.find).toHaveBeenCalledWith({
                user: userId,
                status: 'completed'
            });
        });

        it('should return 500 if database query fails (Error Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockRejectedValue(new Error('DB error'))
            });

            const response = await request(app)
                .get(`/api/regular-collections/user/${userId}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    // ------------------ Testing GET /api/regular-collections/summary/:userId ------------------
    describe('GET /summary/:userId', () => {
        const userId = '60d0fe4f5311236168a109ca';

        it('should return collection summary for user (Positive Case)', async () => {
            const mockCollections = [
                {
                    _id: '1',
                    status: 'completed',
                    scheduledDate: '2025-12-25',
                    bins: [{ binType: 'general', binName: 'Bin 1' }],
                    updatedAt: new Date()
                },
                {
                    _id: '2',
                    status: 'scheduled',
                    scheduledDate: '2025-12-26',
                    bins: [{ binType: 'recyclable', binName: 'Bin 2' }],
                    updatedAt: new Date()
                }
            ];

            // Mock the populate chain correctly
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockCollections)
            });

            const response = await request(app)
                .get(`/api/regular-collections/summary/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalCollections).toBe(2);
            expect(response.body.data.completed).toBe(1);
            expect(response.body.data.pending).toBe(1);
            expect(response.body.data.byBinType).toHaveProperty('general');
        });

        it('should handle empty collections for user (Edge Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            });

            const response = await request(app)
                .get(`/api/regular-collections/summary/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.data.totalCollections).toBe(0);
            expect(response.body.data.completed).toBe(0);
            expect(response.body.data.recentActivity).toHaveLength(0);
        });

        it('should return 500 if summary calculation fails (Error Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Summary error'))
            });

            const response = await request(app)
                .get(`/api/regular-collections/summary/${userId}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    // ------------------ Testing GET /api/regular-collections/upcoming/:userId ------------------
    describe('GET /upcoming/:userId', () => {
        const userId = '60d0fe4f5311236168a109ca';

        it('should return upcoming collections for user (Positive Case)', async () => {
            const mockUpcomingCollections = [
                {
                    _id: '1',
                    status: 'scheduled',
                    scheduledDate: '2025-12-25',
                    bins: [{ binName: 'Upcoming Bin 1' }]
                }
            ];

            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockUpcomingCollections)
            });

            const response = await request(app)
                .get(`/api/regular-collections/upcoming/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockUpcomingCollections);
        });

        it('should return empty array if no upcoming collections (Edge Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            });

            const response = await request(app)
                .get(`/api/regular-collections/upcoming/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.data).toEqual([]);
        });
    });

  
});