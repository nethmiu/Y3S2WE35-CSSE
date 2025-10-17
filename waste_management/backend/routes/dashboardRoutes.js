import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import request from 'supertest';
import express from 'express';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
app.use('/api/dashboard', dashboardRoutes);

const DashboardScreen = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Replace YOUR_IP and PORT with actual values
            const response = await fetch('http://YOUR_IP:PORT/api/dashboard');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch dashboard data');
            }

            setDashboardData(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* User Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>User Information</Text>
                <Text>Name: {dashboardData.user.name}</Text>
                <Text>IT Number: {dashboardData.user.itNumber}</Text>
            </View>

            {/* Waste Summary Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Waste Summary</Text>
                <Text>Total This Month: {dashboardData.wasteSummary.totalWasteThisMonth} kg</Text>
                <View style={styles.breakdown}>
                    {Object.entries(dashboardData.wasteSummary.breakdown).map(([key, value]) => (
                        <Text key={key}>{key}: {value} kg</Text>
                    ))}
                </View>
            </View>

            {/* Payment Summary Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Summary</Text>
                <Text>Outstanding: Rs. {dashboardData.paymentSummary.outstandingBalance}</Text>
                <Text>Total Payments: Rs. {dashboardData.paymentSummary.totalPayments}</Text>
                <Text>Paybacks: Rs. {dashboardData.paymentSummary.paybacks}</Text>
            </View>

            {/* Upcoming Collections Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Collections</Text>
                {dashboardData.upcomingCollections.map((collection) => (
                    <View key={collection.id} style={styles.collectionItem}>
                        <Text>Date: {collection.date}</Text>
                        <Text>Type: {collection.type}</Text>
                        <Text>Status: {collection.status}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    breakdown: {
        marginTop: 8,
    },
    collectionItem: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f8f8f8',
        borderRadius: 4,
    }
});

export default DashboardScreen;

describe('Dashboard API Endpoints', () => {
    // Positive Case
    test('GET /api/dashboard should return 200 and correct user data', async () => {
        const response = await request(app).get('/api/dashboard');
        
        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.name).toBe('Gimhan T P K');
        expect(response.body.user.itNumber).toBe('IT22266996');
    });

    // Data Integrity Case
    test('Response should have correct data structure and types', async () => {
        const response = await request(app).get('/api/dashboard');
        
        expect(response.body).toEqual(
            expect.objectContaining({
                user: expect.any(Object),
                wasteSummary: expect.any(Object),
                paymentSummary: expect.any(Object),
                upcomingCollections: expect.any(Array)
            })
        );

        expect(response.body.paymentSummary).toEqual(
            expect.objectContaining({
                outstandingBalance: expect.any(Number),
                totalPayments: expect.any(Number),
                paybacks: expect.any(Number)
            })
        );
    });

    // Error Case
    test('Should handle server errors gracefully', async () => {
        // Mock implementation to simulate error
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockApp = express();
        mockApp.use('/api/dashboard', (req, res) => {
            res.status(500).json({ 
                message: "Error fetching dashboard data",
                error: "Internal server error"
            });
        });

        const response = await request(mockApp).get('/api/dashboard');
        expect(response.status).toBe(500);
        expect(response.body.message).toBeDefined();
    });

    // Edge Case
    test('Should handle empty upcoming collections', async () => {
        const mockApp = express();
        mockApp.use('/api/dashboard', (req, res) => {
            const data = {
                user: { name: "Gimhan T P K", itNumber: "IT22266996" },
                wasteSummary: { totalWasteThisMonth: 0, breakdown: {} },
                paymentSummary: { outstandingBalance: 0, totalPayments: 0, paybacks: 0 },
                upcomingCollections: []
            };
            res.json(data);
        });

        const response = await request(mockApp).get('/api/dashboard');
        expect(response.status).toBe(200);
        expect(response.body.upcomingCollections).toEqual([]);
    });
});

const getDashboardData = async (req, res) => {
    try {
        // Static dashboard data
        const dashboardData = {
            user: {
                name: "Gimhan T P K",
                itNumber: "IT22266996"
            },
            wasteSummary: {
                totalWasteThisMonth: 250.5, // in kg
                breakdown: {
                    organic: 120.3,
                    plastic: 50.8,
                    paper: 45.2,
                    glass: 34.2
                }
            },
            paymentSummary: {
                outstandingBalance: 2500.00,
                totalPayments: 7500.00,
                paybacks: 500.00
            },
            upcomingCollections: [
                {
                    id: "COL001",
                    date: "2025-10-20",
                    type: "Regular",
                    status: "Scheduled"
                },
                {
                    id: "COL002",
                    date: "2025-10-25",
                    type: "Special",
                    status: "Pending"
                }
            ]
        };

        return res.status(200).json(dashboardData);
    } catch (error) {
        return res.status(500).json({ 
            message: "Error fetching dashboard data", 
            error: error.message 
        });
    }
};

module.exports = {
    getDashboardData
};