import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import config from '../config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconCommunity from 'react-native-vector-icons/MaterialCommunityIcons';

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;

// Mock data for Ongoing Regular Schedules
const ongoingMockData = [
    { id: '1', date: '15 October 2025', time: '11:00 AM', status: 'In progress' },
    { id: '2', date: '16 October 2025', time: '11:00 AM', status: 'Pending' },
    { id: '3', date: '17 October 2025', time: '11:00 AM', status: 'Pending' },
];

// Header Component
const ListHeader = ({ userDetails }) => (
    <>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
                <Icon name="admin-panel-settings" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Welcome Manager!</Text>
            <Text style={styles.greeting}>{userDetails.email}</Text>
        </View>

        {/* Ongoing Schedules (Mock Data) */}
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <IconCommunity name="calendar-clock" size={24} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Ongoing Regular Schedules</Text>
            </View>
            {ongoingMockData.map(item => (
                <View key={item.id} style={styles.scheduleItem}>
                    <View style={styles.scheduleLeft}>
                        <View style={styles.iconBadge}>
                            <Icon name="event" size={20} color="#4CAF50" />
                        </View>
                        <View style={styles.scheduleInfo}>
                            <Text style={styles.itemDate}>{item.date}</Text>
                            <View style={styles.timeRow}>
                                <Icon name="access-time" size={14} color="#7F8C8D" />
                                <Text style={styles.itemTime}>{item.time}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        item.status === 'Pending' ? styles.statusPending : styles.statusInProgress
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.status === 'Pending' ? styles.statusPendingText : styles.statusInProgressText
                        ]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            ))}
        </View>

        {/* Special Collections List Header */}
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <IconCommunity name="delete-variant" size={24} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Special Collection Schedules</Text>
            </View>
        </View>
    </>
);


const ManagerScreen = ({ route, navigation }) => {
    const { userDetails } = route.params;

    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/all`);
                setSchedules(data);
            } catch (error) {
                alert('Failed to load schedules.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchedules();
    }, []);

    const handleLogout = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const renderScheduleItem = ({ item }) => (
        <View style={styles.specialScheduleItem}>
            <View style={styles.scheduleLeft}>
                <View style={styles.iconBadge}>
                    <IconCommunity name="delete-variant" size={20} color="#4CAF50" />
                </View>
                <View style={styles.scheduleInfo}>
                    <Text style={styles.itemDate}>{new Date(item.date).toDateString()}</Text>
                    <View style={styles.timeRow}>
                        <Icon name="access-time" size={14} color="#7F8C8D" />
                        <Text style={styles.itemTime}>{item.timeSlot}</Text>
                    </View>
                    <View style={styles.userRow}>
                        <Icon name="person" size={14} color="#7F8C8D" />
                        <Text style={styles.itemUser}>{item.user.email}</Text>
                    </View>
                </View>
            </View>
            <View style={[
                styles.statusBadge,
                item.status === 'Pending' ? styles.statusPending : styles.statusInProgress
            ]}>
                <Text style={[
                    styles.statusText,
                    item.status === 'Pending' ? styles.statusPendingText : styles.statusInProgressText
                ]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading schedules...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={schedules}
                renderItem={renderScheduleItem}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={<ListHeader userDetails={userDetails} />}
                ListFooterComponent={
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Icon name="logout" size={22} color="#fff" />
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="inbox" size={60} color="#BDC3C7" />
                        <Text style={styles.emptyText}>No special schedules found.</Text>
                    </View>
                }
                contentContainerStyle={styles.container}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    container: {
        padding: 15,
    },
    welcomeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 25,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    welcomeIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
    },
    greeting: {
        fontSize: 15,
        color: '#7F8C8D',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E8F5E9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginLeft: 10,
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    specialScheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginBottom: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    scheduleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scheduleInfo: {
        flex: 1,
    },
    itemDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    itemTime: {
        fontSize: 14,
        color: '#7F8C8D',
        marginLeft: 5,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    itemUser: {
        fontSize: 13,
        color: '#95A5A6',
        marginLeft: 5,
        fontStyle: 'italic',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    statusPending: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
    },
    statusPendingText: {
        color: '#F57C00',
    },
    statusInProgress: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    statusInProgressText: {
        color: '#2E7D32',
    },
    emptyContainer: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 15,
        fontSize: 16,
        color: '#95A5A6',
    },
    buttonContainer: {
        marginTop: 30,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    logoutButton: {
        backgroundColor: '#E74C3C',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        shadowColor: '#E74C3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ManagerScreen;