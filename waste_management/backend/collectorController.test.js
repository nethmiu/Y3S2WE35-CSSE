const request = require('supertest');
const express = require('express');
const collectorRoutes = require('./routes/collectorRoutes');
const CollectionSchedule = require('./models/collectionScheduleModel');
const Bin = require('./models/binModel');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api/collector', collectorRoutes);

// Mocking the models
jest.mock('./models/collectionScheduleModel');
jest.mock('./models/binModel');

// =================== Test Suite for Collector Controller ===================
describe('Collector Controller API', () => {

    // Mock reset before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------ Testing GET /api/collector/schedules ------------------
    describe('GET /schedules', () => {
        it('should return today\'s schedules for collector (Positive Case)', async () => {
            const mockSchedules = [
                {
                    _id: '1',
                    scheduledDate: new Date().toISOString(),
                    timeSlot: '8:00 AM - 11:00 AM',
                    status: 'scheduled',
                    user: { email: 'user1@example.com', name: 'User One' },
                    bins: [{ binName: 'Bin 1', binType: 'general' }]
                }
            ];

            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockSchedules)
            });

            const response = await request(app).get('/api/collector/schedules');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockSchedules);
            expect(response.body.count).toBe(1);
        });

        it('should return 500 if database query fails (Error Case)', async () => {
            CollectionSchedule.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app).get('/api/collector/schedules');

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Server Error');
        });
    });

    // ------------------ Testing POST /api/collector/verify-bin ------------------
    describe('POST /verify-bin', () => {
        const validVerifyData = {
            qrCode: 'BIN-123456789-abc123',
            collectorId: 'collector123'
        };

        it('should verify bin and schedule successfully (Positive Case)', async () => {
            const mockBin = {
                _id: 'bin123',
                qrCode: 'BIN-123456789-abc123',
                user: { email: 'user@example.com', name: 'Test User' }
            };

            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                user: { email: 'user@example.com', name: 'Test User' },
                bins: [{ binName: 'Test Bin', binType: 'general' }]
            };

            // Mock Bin.findOne with populate
            Bin.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBin)
            });

            // Mock CollectionSchedule.findOne with multiple populate calls
            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findOne.mockReturnValue(mockQuery);

            const response = await request(app)
                .post('/api/collector/verify-bin')
                .send(validVerifyData);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.verified).toBe(true);
            expect(response.body.bin).toEqual(mockBin);
        });

        it('should return 404 if bin not found (Negative Case)', async () => {
            Bin.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const response = await request(app)
                .post('/api/collector/verify-bin')
                .send(validVerifyData);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Bin not found');
        });

        it('should return 404 if no active schedule found (Negative Case)', async () => {
            const mockBin = {
                _id: 'bin123',
                qrCode: 'BIN-123456789-abc123',
                user: { email: 'user@example.com', name: 'Test User' }
            };

            Bin.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBin)
            });

            // Mock CollectionSchedule.findOne to return null (no schedule found)
            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(null)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findOne.mockReturnValue(mockQuery);

            const response = await request(app)
                .post('/api/collector/verify-bin')
                .send(validVerifyData);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.verified).toBe(false);
            expect(response.body.message).toContain('No active schedule found');
        });

        it('should return 500 if verification fails (Error Case)', async () => {
            Bin.findOne.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app)
                .post('/api/collector/verify-bin')
                .send(validVerifyData);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    // ------------------ Testing PUT /api/collector/update-status ------------------
    describe('PUT /update-status', () => {
        const validUpdateData = {
            scheduleId: 'schedule123',
            status: 'in-progress'
        };

        it('should update collection status successfully (Positive Case)', async () => {
            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                startedAt: null,
                save: jest.fn().mockResolvedValue({
                    _id: 'schedule123',
                    status: 'in-progress',
                    startedAt: new Date(),
                    populate: jest.fn().mockImplementation((field, fields) => {
                        if (field === 'bins') {
                            return Promise.resolve({
                                ...this,
                                bins: [{ binName: 'Updated Bin' }],
                                populate: jest.fn().mockResolvedValue({
                                    ...this,
                                    collector: { email: 'collector@example.com' }
                                })
                            });
                        }
                        return Promise.resolve(this);
                    })
                })
            };

            // Mock findById with multiple populate calls
            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/update-status')
                .send(validUpdateData);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successfully');
        });

        it('should set start time when status changes to in-progress (Positive Case)', async () => {
            const startTime = new Date();
            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                startedAt: null,
                save: jest.fn().mockResolvedValue({
                    _id: 'schedule123',
                    status: 'in-progress',
                    startedAt: startTime,
                    populate: jest.fn().mockResolvedValue(this)
                })
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/update-status')
                .send({
                    scheduleId: 'schedule123',
                    status: 'in-progress'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 if schedule not found (Negative Case)', async () => {
            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(null)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/update-status')
                .send(validUpdateData);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return 500 if update fails (Error Case)', async () => {
            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                save: jest.fn().mockRejectedValue(new Error('Save error'))
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/update-status')
                .send(validUpdateData);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    // ------------------ Testing PUT /api/collector/complete-collection ------------------
    describe('PUT /complete-collection', () => {
        const validCompleteData = {
            scheduleId: 'schedule123',
            wasteLevel: 75,
            notes: 'Collection completed successfully'
        };

        it('should complete collection successfully (Positive Case)', async () => {
            const mockSchedule = {
                _id: 'schedule123',
                status: 'in-progress',
                wasteLevel: null,
                notes: '',
                collectedAt: null,
                save: jest.fn().mockResolvedValue({
                    _id: 'schedule123',
                    status: 'completed',
                    wasteLevel: 75,
                    notes: 'Collection completed successfully',
                    collectedAt: new Date(),
                    populate: jest.fn().mockResolvedValue({
                        _id: 'schedule123',
                        status: 'completed',
                        wasteLevel: 75
                    })
                })
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/complete-collection')
                .send(validCompleteData);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('completed successfully');
        });

        it('should return 400 for invalid waste level (Negative Case)', async () => {
            // This should be caught by the validation before database call
            const invalidData = {
                scheduleId: 'schedule123',
                wasteLevel: 150, // Invalid waste level
                notes: 'Test notes'
            };

            const mockSchedule = {
                _id: 'schedule123',
                status: 'in-progress',
                save: jest.fn().mockResolvedValue(this)
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/complete-collection')
                .send(invalidData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Waste level must be between 0 and 100');
        });

        it('should return 404 if schedule not found (Negative Case)', async () => {
            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(null)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/complete-collection')
                .send(validCompleteData);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return 500 if completion fails (Error Case)', async () => {
            const mockSchedule = {
                _id: 'schedule123',
                status: 'in-progress',
                save: jest.fn().mockRejectedValue(new Error('Save error'))
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/complete-collection')
                .send(validCompleteData);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    // ------------------ Testing PUT /api/collector/reject-collection ------------------
    describe('PUT /reject-collection', () => {
        const validRejectData = {
            scheduleId: 'schedule123',
            reason: 'Bin not accessible'
        };

        it('should reject collection successfully (Positive Case)', async () => {
            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                rejectedReason: null,
                collectedAt: null,
                save: jest.fn().mockResolvedValue({
                    _id: 'schedule123',
                    status: 'rejected',
                    rejectedReason: 'Bin not accessible',
                    collectedAt: new Date(),
                    populate: jest.fn().mockResolvedValue({
                        _id: 'schedule123',
                        status: 'rejected',
                        rejectedReason: 'Bin not accessible'
                    })
                })
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/reject-collection')
                .send(validRejectData);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('rejected successfully');
        });

        it('should return 400 if rejection reason is missing (Negative Case)', async () => {
            const invalidData = {
                scheduleId: 'schedule123',
                reason: '' // Empty reason
            };

            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                save: jest.fn().mockResolvedValue(this)
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/reject-collection')
                .send(invalidData);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Rejection reason is required');
        });

        it('should return 404 if schedule not found (Negative Case)', async () => {
            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(null)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/reject-collection')
                .send(validRejectData);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return 500 if rejection fails (Error Case)', async () => {
            const mockSchedule = {
                _id: 'schedule123',
                status: 'scheduled',
                save: jest.fn().mockRejectedValue(new Error('Save error'))
            };

            const mockQuery = {
                populate: jest.fn().mockImplementation((field, fields) => {
                    if (field === 'user') {
                        return {
                            populate: jest.fn().mockResolvedValue(mockSchedule)
                        };
                    }
                    return mockQuery;
                })
            };
            CollectionSchedule.findById.mockReturnValue(mockQuery);

            const response = await request(app)
                .put('/api/collector/reject-collection')
                .send(validRejectData);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    // ------------------ Testing GET /api/collector/stats/:collectorId ------------------
    describe('GET /stats/:collectorId', () => {
        const collectorId = 'collector123';

        it('should return collector statistics successfully (Positive Case)', async () => {
            const mockTodayCollections = [
                { status: 'completed' },
                { status: 'scheduled' },
                { status: 'completed' }
            ];

            const mockWeekCollections = [
                { status: 'completed' },
                { status: 'completed' },
                { status: 'scheduled' }
            ];

            const mockAllCollections = [
                { status: 'completed' },
                { status: 'scheduled' },
                { status: 'completed' },
                { status: 'rejected' }
            ];

            // Mock the find calls to return arrays directly (matching your controller implementation)
            CollectionSchedule.find
                .mockReturnValueOnce(mockTodayCollections) // First call returns array directly
                .mockReturnValueOnce(mockWeekCollections)  // Second call returns array directly  
                .mockReturnValueOnce(mockAllCollections);  // Third call returns array directly

            const response = await request(app)
                .get(`/api/collector/stats/${collectorId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalCollections).toBe(4);
            expect(response.body.data.todayCollections).toBe(3);
            expect(response.body.data.completedToday).toBe(2);
            expect(response.body.data.completedThisWeek).toBe(2);
            expect(response.body.data.performance).toBe(67);
        });

        it('should handle zero collections gracefully (Edge Case)', async () => {
            CollectionSchedule.find
                .mockReturnValueOnce([]) // Today collections
                .mockReturnValueOnce([]) // Week collections
                .mockReturnValueOnce([]); // All collections

            const response = await request(app)
                .get(`/api/collector/stats/${collectorId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.data.totalCollections).toBe(0);
            expect(response.body.data.todayCollections).toBe(0);
            expect(response.body.data.completedToday).toBe(0);
            expect(response.body.data.performance).toBe(0);
        });

        it('should return 500 if stats calculation fails (Error Case)', async () => {
            CollectionSchedule.find.mockImplementation(() => {
                throw new Error('Stats error');
            });

            const response = await request(app)
                .get(`/api/collector/stats/${collectorId}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});