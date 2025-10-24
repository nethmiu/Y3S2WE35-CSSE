const request = require('supertest');
const express = require('express');
const binRoutes = require('./routes/binRoutes');
const Bin = require('./models/binModel');
const User = require('./models/userModel');
const QRCode = require('qrcode');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api/bins', binRoutes);

// Mocking the models and QRCode
jest.mock('./models/binModel');
jest.mock('./models/userModel');
jest.mock('qrcode');

// =================== Test Suite for Bin Controller ===================
describe('Bin Controller API', () => {
    // Mock reset before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------ Testing POST /api/bins ------------------
    describe('POST /api/bins', () => {
        const validBinData = {
            userId: '60d0fe4f5311236168a109ca',
            location: {
                address: '123 Main Street',
                latitude: 6.9271,
                longitude: 79.8612
            },
            binType: 'general',
            capacity: 50,
            binName: 'Kitchen Bin'
        };

        it('should create a new bin with valid data (Positive Case)', async () => {
            // Mock User.findById
            User.findById.mockResolvedValue({ _id: validBinData.userId, email: 'test@example.com' });
            
            // Mock Bin.save - return the actual object structure
            const mockBin = {
                _id: '507f1f77bcf86cd799439011',
                ...validBinData,
                qrCode: 'BIN-123456789-abc123',
                createdAt: new Date(),
                updatedAt: new Date(),
                // Add _doc property for the spread operator
                _doc: {
                    _id: '507f1f77bcf86cd799439011',
                    ...validBinData,
                    qrCode: 'BIN-123456789-abc123',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };
            
            Bin.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(mockBin)
            }));

            // Mock QRCode generation
            QRCode.toDataURL.mockResolvedValue('data:image/png;base64,qrcodeimage');

            const response = await request(app)
                .post('/api/bins')
                .send(validBinData);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('qrCodeImage');
            expect(response.body.binName).toBe('Kitchen Bin');
            expect(User.findById).toHaveBeenCalledWith(validBinData.userId);
        });

        it('should return 404 if user not found (Negative Case)', async () => {
            User.findById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/bins')
                .send(validBinData);

            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('User not found');
        });
    });

    // ------------------ Testing GET /api/bins ------------------
    describe('GET /api/bins', () => {
        it('should return all bins with user details (Positive Case)', async () => {
            const mockBins = [
                {
                    _id: '1',
                    binName: 'Bin 1',
                    binType: 'general',
                    user: { email: 'user1@example.com', profile: {} }
                }
            ];

            // Mock the Mongoose query chain
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockBins)
            };
            Bin.find.mockReturnValue(mockQuery);

            const response = await request(app).get('/api/bins');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockBins);
            expect(Bin.find).toHaveBeenCalledWith({});
        });
    });

    // ------------------ Testing GET /api/bins/user/:userId ------------------
    describe('GET /api/bins/user/:userId', () => {
        const userId = '60d0fe4f5311236168a109ca';

        it('should return bins for specific user (Positive Case)', async () => {
            const mockBins = [
                { _id: '1', binName: 'User Bin 1', user: userId }
            ];

            const mockQuery = {
                sort: jest.fn().mockResolvedValue(mockBins)
            };
            Bin.find.mockReturnValue(mockQuery);

            const response = await request(app).get(`/api/bins/user/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.count).toBe(1);
            expect(response.body.bins).toEqual(mockBins);
        });

        it('should return empty array for user with no bins (Edge Case)', async () => {
            const mockQuery = {
                sort: jest.fn().mockResolvedValue([])
            };
            Bin.find.mockReturnValue(mockQuery);

            const response = await request(app).get(`/api/bins/user/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.count).toBe(0);
            expect(response.body.bins).toEqual([]);
        });
    });

    // ------------------ Testing GET /api/bins/:id ------------------
    describe('GET /api/bins/:id', () => {
        const binId = '507f1f77bcf86cd799439011';

        it('should return bin by ID with QR code (Positive Case)', async () => {
            const mockBin = {
                _id: binId,
                binName: 'Test Bin',
                qrCode: 'BIN-123456789-abc123',
                user: { email: 'user@example.com', profile: {} },
                // Add _doc property for the spread operator
                _doc: {
                    _id: binId,
                    binName: 'Test Bin',
                    qrCode: 'BIN-123456789-abc123',
                    user: { email: 'user@example.com', profile: {} }
                }
            };

            const mockQuery = {
                populate: jest.fn().mockResolvedValue(mockBin)
            };
            Bin.findById.mockReturnValue(mockQuery);
            QRCode.toDataURL.mockResolvedValue('data:image/png;base64,qrcodeimage');

            const response = await request(app).get(`/api/bins/${binId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('qrCodeImage');
            expect(response.body.binName).toBe('Test Bin');
            expect(Bin.findById).toHaveBeenCalledWith(binId);
        });

        it('should return 404 if bin not found (Negative Case)', async () => {
            const mockQuery = {
                populate: jest.fn().mockResolvedValue(null)
            };
            Bin.findById.mockReturnValue(mockQuery);

            const response = await request(app).get(`/api/bins/${binId}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('Bin not found');
        });
    });

    // ------------------ Testing GET /api/bins/:id/qrcode ------------------
    describe('GET /api/bins/:id/qrcode', () => {
        const binId = '507f1f77bcf86cd799439011';

        it('should generate QR code for bin (Positive Case)', async () => {
            const mockBin = {
                _id: binId,
                qrCode: 'BIN-123456789-abc123',
                binName: 'Test Bin',
                binType: 'general',
                capacity: 50,
                location: { address: '123 Main St' },
                user: { email: 'user@example.com', profile: {} }
            };

            const mockQuery = {
                populate: jest.fn().mockResolvedValue(mockBin)
            };
            Bin.findById.mockReturnValue(mockQuery);
            QRCode.toDataURL.mockResolvedValue('data:image/png;base64,qrcodeimage');

            const response = await request(app).get(`/api/bins/${binId}/qrcode`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('qrCodeImage');
            expect(response.body.qrCode).toBe('BIN-123456789-abc123');
            expect(response.body.binDetails.binName).toBe('Test Bin');
        });

        it('should return 404 if bin not found (Negative Case)', async () => {
            const mockQuery = {
                populate: jest.fn().mockResolvedValue(null)
            };
            Bin.findById.mockReturnValue(mockQuery);

            const response = await request(app).get(`/api/bins/${binId}/qrcode`);

            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('Bin not found');
        });
    });


});