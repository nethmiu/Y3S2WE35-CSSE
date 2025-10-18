// backend/__tests__/dashboard.test.js
const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../routes/dashboardRoutes');
const dashboardController = require('../controllers/dashboardController'); // Controller එක import කරගන්නවා

// Create a mock Express app to test the routes in isolation
const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

// =================== Test Suite for Dashboard API ===================
describe('Dashboard API - GET /api/dashboard', () => {

  // Test Case 1: Positive Case
  it('should return a 200 status and dashboard data on successful fetch', async () => {
    const response = await request(app).get('/api/dashboard');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.user.name).toBe('Gimhan T P K');
  });

  // Test Case 2: Data Integrity Case
  it('should return data with the correct structure and types', async () => {
    const response = await request(app).get('/api/dashboard');
    
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('wasteSummary');
    expect(response.body).toHaveProperty('paymentSummary');
    expect(response.body).toHaveProperty('upcomingCollections');

    expect(typeof response.body.user.name).toBe('string');
    expect(typeof response.body.wasteSummary.totalWasteThisMonth).toBe('number');
    expect(Array.isArray(response.body.upcomingCollections)).toBe(true);
  });

  // Test Case 3: Error Case (Negative Case) - **FINAL, CORRECTED VERSION**
  it('should return a 500 status if the controller logic throws an error', async () => {
    // We use jest.spyOn to temporarily 'spy' on the getDashboardData function
    // and override its implementation for just this one test.
    const errorSpy = jest.spyOn(dashboardController, 'getDashboardData').mockImplementation((req, res) => {
      // We force an error to be thrown inside the function,
      // which will be caught by the try...catch block in the actual controller.
      // This is how we test the 'catch' block.
      throw new Error("Simulated database failure");
    });

    // Now, we make the API call. The Express route will call our mocked function,
    // which will throw an error, and the real catch block will handle it.
    // Note: Since our controller's catch block doesn't use the error object itself,
    // we need to slightly modify the controller to ensure the test passes as expected.
    // Let's assume the controller is correct and the test needs adjustment.
    // The spy should actually call the original implementation but after making it fail.

    // A better way to test the catch block without changing controller code:
    const anotherSpy = jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
        throw new Error('Simulated JSON processing error');
    });

    const response = await request(app).get('/api/dashboard');
    
    // Assert that the catch block was executed
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Server error while fetching dashboard data.');

    // Restore the original functions after the test to prevent side effects
    anotherSpy.mockRestore();
    errorSpy.mockRestore(); // Ensure spy is restored even if the first restore isn't called
  });

});