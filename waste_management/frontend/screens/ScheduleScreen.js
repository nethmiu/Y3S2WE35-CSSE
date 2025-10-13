import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ScrollView, ActivityIndicator, Image, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons'; 

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;

// Mock data for Regular Schedules
const ongoingMockData = [
    { id: '1', date: '30 August 2025', time: '11:00 AM', status: 'In progress' },
    { id: '2', date: '30 August 2025', time: '11:00 AM', status: 'Pending' },
];

const ScheduleScreen = ({ route, navigation }) => {
    // Safe parameter handling with default values
    const userDetails = route.params?.userDetails || { _id: 'unknown', email: 'Unknown User' };

    const [specialSchedules, setSpecialSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch schedules function
    const fetchMySchedules = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/my-schedules/${userDetails._id}`);
            setSpecialSchedules(data);
        } catch (error) {
            console.log('Error fetching schedules:', error);
            alert('Failed to load your special schedules.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userDetails._id && userDetails._id !== 'unknown') {
            fetchMySchedules();
        } else {
            setIsLoading(false);
        }
    }, [userDetails._id]);

    // Pull to refresh function
    const onRefresh = () => {
        setRefreshing(true);
        fetchMySchedules();
    };

    // Manual refresh function
    const handleRefresh = () => {
        setIsLoading(true);
        fetchMySchedules();
    };

    const handleLogout = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2ecc71']}
                        tintColor="#2ecc71"
                    />
                }
            >
                <View style={styles.headerContainer}>
                    
                    <Text style={styles.title}>Ongoing Schedules</Text>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={handleRefresh}
                        disabled={isLoading}
                    >
                       
                    </TouchableOpacity>
                </View>

                {/* Regular Schedules (Mock Data) */}
                <View style={styles.listContainer}>
                    <View style={styles.listHeaderContainer}>
                        <Text style={styles.listHeader}>Regular Schedules</Text>
                        <Ionicons name="calendar" size={20} color="#34495e" />
                    </View>
                    {ongoingMockData.map(item => (
                        <View key={item.id} style={styles.scheduleItem}>
                            <View style={styles.scheduleInfo}>
                                <Ionicons name="time-outline" size={16} color="#666" style={styles.scheduleIcon} />
                                <View>
                                    <Text style={styles.itemDate}>{item.date}</Text>
                                    <Text style={styles.itemTime}>{item.time}</Text>
                                </View>
                            </View>
                            <Text style={[
                                styles.itemStatus,
                                item.status === 'Pending' ? styles.statusPending : styles.statusInProgress
                            ]}>
                                {item.status}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Special Collection Schedules (Real Data) */}
                <View style={styles.listContainer}>
                    <View style={styles.listHeaderContainer}>
                        <Text style={styles.listHeader}>Special Collection Schedules</Text>
                        <Ionicons name="star" size={20} color="#34495e" />
                    </View>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2ecc71" />
                            <Text style={styles.loadingText}>Loading schedules...</Text>
                        </View>
                    ) : specialSchedules.length > 0 ? (
                        specialSchedules.map(item => (
                            <View key={item._id} style={styles.scheduleItem}>
                                <View style={styles.scheduleInfo}>
                                    <Ionicons name="trash-outline" size={16} color="#666" style={styles.scheduleIcon} />
                                    <View>
                                        <Text style={styles.itemDate}>{new Date(item.date).toDateString()}</Text>
                                        <Text style={styles.itemTime}>{item.timeSlot}</Text>
                                    </View>
                                </View>
                                <Text style={[
                                    styles.itemStatus,
                                    item.status === 'Pending' ? styles.statusPending : styles.statusInProgress
                                ]}>
                                    {item.status}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>You have no special schedules.</Text>
                            <Text style={styles.emptySubtext}>Pull down to refresh or add a new schedule</Text>
                        </View>
                    )}
                </View>

                {/* Add Special Collection Button */}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddSpecialCollection', { userDetails })}
                >
                    <Ionicons name="add-circle" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add Special Collection Schedule</Text>
                </TouchableOpacity>
                
                <View style={styles.logoutButtonContainer}>
                    <Button title="Logout" onPress={handleLogout} color="#ff5c5c" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    container: {
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    refreshButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    listHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    scheduleIcon: {
        marginRight: 10,
    },
    itemDate: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2c3e50',
    },
    itemTime: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    itemStatus: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        overflow: 'hidden',
        textAlign: 'center',
        minWidth: 80,
    },
    statusPending: {
        color: '#e67e22',
        backgroundColor: '#fdf3e6',
    },
    statusInProgress: {
        color: '#27ae60',
        backgroundColor: '#e8f6ef',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 10,
        color: '#777',
        fontSize: 16,
        fontWeight: '500',
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#2ecc71',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    logoutButtonContainer: {
        marginTop: 30,
        alignSelf: 'center',
        width: '60%',
    }
});

export default ScheduleScreen;