import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons'; 

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;

// Mock data for Regular Schedules
const ongoingMockData = [
    { id: '1', date: '30 August 2025', time: '11:00 AM', status: 'In progress' },
    { id: '2', date: '30 August 2025', time: '11:00 AM', status: 'Pending' },
];

const HomeScreen = ({ route, navigation }) => {
    const { userDetails } = route.params;

    const [specialSchedules, setSpecialSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        //get User-specific Special Collection Schedules 
        const fetchMySchedules = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/my-schedules/${userDetails._id}`);
                setSpecialSchedules(data);
            } catch (error) {
                alert('Failed to load your special schedules.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMySchedules();
    }, []);

    const handleLogout = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Ongoing Schedules</Text>
                    
                </View>

                {/* Regular Schedules (Mock Data) */}
                <View style={styles.listContainer}>
                    <Text style={styles.listHeader}>Regular Schedules</Text>
                    {ongoingMockData.map(item => (
                        <View key={item.id} style={styles.scheduleItem}>
                            <View>
                                <Text style={styles.itemDate}>{item.date}</Text>
                                <Text style={styles.itemTime}>{item.time}</Text>
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
                    <Text style={styles.listHeader}>Special Collection Schedules</Text>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 20 }} />
                    ) : specialSchedules.length > 0 ? (
                        specialSchedules.map(item => (
                            <View key={item._id} style={styles.scheduleItem}>
                                <View>
                                    <Text style={styles.itemDate}>{new Date(item.date).toDateString()}</Text>
                                    <Text style={styles.itemTime}>{item.timeSlot}</Text>
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
                        <Text style={styles.emptyText}>You have no special schedules.</Text>
                    )}
                </View>

                {/* Add Special Collection Button */}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddSpecialCollection', { userDetails })}
                >
                    <Ionicons name="add" size={24} color="white" />
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
    profilePic: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    listHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#34495e',
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemDate: {
        fontSize: 15,
        fontWeight: '500',
    },
    itemTime: {
        fontSize: 13,
        color: '#555',
    },
    itemStatus: {
        fontSize: 13,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusPending: {
        color: '#e67e22',
        backgroundColor: '#fdf3e6',
    },
    statusInProgress: {
        color: '#27ae60',
        backgroundColor: '#e8f6ef',
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
        color: '#777',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#2ecc71',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 2,
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

export default HomeScreen;