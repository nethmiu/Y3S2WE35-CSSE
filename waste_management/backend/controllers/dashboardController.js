// backend/controllers/dashboardController.js

/**
 * @desc    Get dashboard summary data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardData = (req, res) => {
  try {
    // This is a mock implementation. In a real-world scenario,
    // this data would be fetched and aggregated from a database.
    const mockDashboardData = {
      user: {
        name: "Gimhan T P K",
        itNumber: "IT22266996",
      },
      wasteSummary: {
        totalWasteThisMonth: 62.5, // in kg
        breakdown: {
          Organic: 140,
          Recyclable: 215,
          "Non-organic": 125,
        },
      },
      paymentSummary: {
        outstandingBalance: 3245.58,
        totalPayments: 111460.80,
        paybacks: 10160.40,
      },
      upcomingCollections: [
        {
          id: "col_1",
          date: "2025-10-30",
          type: "Regular",
          status: "Scheduled",
        },
        {
          id: "col_2",
          date: "2025-11-05",
          type: "Special (E-Waste)",
          status: "Confirmed",
        },
      ],
    };

    res.status(200).json(mockDashboardData);
  } catch (error) {
    // This will be caught by our unit test for error handling
    res.status(500).json({ message: "Server error while fetching dashboard data." });
  }
};

module.exports = {
  getDashboardData,
};