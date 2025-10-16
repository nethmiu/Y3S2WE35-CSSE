import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
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
            {/* Enhanced Header with Gradient Effect */}
            
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <View style={styles.backButtonCircle}>
                            <Ionicons name="arrow-back" size={22} color="#099928ff" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Schedule</Text>
                        <View style={styles.headerUnderline} />
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.onlineIndicator} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#099928ff']}
                        tintColor="#099928ff"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Enhanced Page Title with Icon */}
                <View style={styles.pageTitleContainer}>
                    <View style={styles.titleIconContainer}>
                        <Ionicons name="time" size={28} color="#099928ff" />
                    </View>
                    <Text style={styles.pageTitle}>Ongoing Schedules</Text>
                    <Text style={styles.pageSubtitle}>Track your waste collection</Text>
                </View>

                {/* Regular Schedules with Enhanced Design */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconWrapper}>
                            <Ionicons name="calendar" size={18} color="#000000ff" />
                        </View>
                        <Text style={styles.sectionTitle}>Regular Schedules</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{ongoingMockData.length}</Text>
                        </View>
                    </View>

                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderText}>
                            <Ionicons name="calendar-outline" size={12} color="#666" /> Date / Time
                        </Text>
                        <Text style={styles.tableHeaderText}>
                            <Ionicons name="information-circle-outline" size={12} color="#666" /> Status
                        </Text>
                    </View>

                    {ongoingMockData.map((item, index) => (
                        <View key={item.id} style={[
                            styles.scheduleCard,
                            index === ongoingMockData.length - 1 && styles.lastCard
                        ]}>
                            <View style={styles.dateTimeContainer}>
                                <View style={styles.dateIconWrapper}>
                                    <Ionicons name="calendar-sharp" size={16} color="#099928ff" />
                                </View>
                                <View style={styles.dateTimeText}>
                                    <Text style={styles.dateText}>{item.date}</Text>
                                    <View style={styles.timeRow}>
                                        <Ionicons name="time-outline" size={12} color="#999" />
                                        <Text style={styles.timeText}>{item.time}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                item.status === 'In progress' ? styles.statusBadgeInProgress : styles.statusBadgePending
                            ]}>
                                <View style={[
                                    styles.statusDot,
                                    item.status === 'In progress' ? styles.dotInProgress : styles.dotPending
                                ]} />
                                <Text style={[
                                    styles.statusText,
                                    item.status === 'In progress' ? styles.statusInProgress : styles.statusPending
                                ]}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Special Collection Schedules with Enhanced Design */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconWrapper, styles.specialIconWrapper]}>
                            <Ionicons name="calendar" size={18} color="#000000ff" />
                        </View>
                        <Text style={styles.sectionTitle}>Special Collection Schedules</Text>
                        {specialSchedules.length > 0 && (
                            <View style={[styles.badge, styles.badgeSpecial]}>
                                <Text style={styles.badgeText}>{specialSchedules.length}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderText}>
                            <Ionicons name="calendar-outline" size={12} color="#666" /> Date / Time
                        </Text>
                        <Text style={styles.tableHeaderText}>
                            <Ionicons name="information-circle-outline" size={12} color="#666" /> Status
                        </Text>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingSpinner}>
                                <ActivityIndicator size="large" color="#099928ff" />
                            </View>
                            <Text style={styles.loadingText}>Loading schedules...</Text>
                        </View>
                    ) : specialSchedules.length > 0 ? (
                        specialSchedules.map((item, index) => (
                            <View key={item._id} style={[
                                styles.scheduleCard,
                                index === specialSchedules.length - 1 && styles.lastCard
                            ]}>
                                <View style={styles.dateTimeContainer}>
                                    <View style={[styles.dateIconWrapper, styles.specialDateIcon]}>
                                        <Ionicons name="calendar" size={18} color="#f39c12" />
                                    </View>
                                    <View style={styles.dateTimeText}>
                                        <Text style={styles.dateText}>{new Date(item.date).toDateString()}</Text>
                                        <View style={styles.timeRow}>
                                            <Ionicons name="time-outline" size={12} color="#999" />
                                            <Text style={styles.timeText}>{item.timeSlot}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    item.status === 'In progress' ? styles.statusBadgeInProgress : styles.statusBadgePending
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        item.status === 'In progress' ? styles.dotInProgress : styles.dotPending
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        item.status === 'In progress' ? styles.statusInProgress : styles.statusPending
                                    ]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="calendar-outline" size={40} color="#bdc3c7" />
                            </View>
                            <Text style={styles.emptyText}>No special schedules yet</Text>
                            <Text style={styles.emptySubtext}>Pull down to refresh or add a new schedule below</Text>
                        </View>
                    )}
                </View>

                {/* Enhanced Add Button */}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddSpecialCollection', { userDetails })}
                    activeOpacity={0.8}
                >
                    <View style={styles.addButtonGradient}>
                        <View style={styles.addIconCircle}>
                            <Ionicons name="add" size={24} color="white" />
                        </View>
                        <Text style={styles.addButtonText}>Add Special Collection Schedule</Text>
                    </View>
                </TouchableOpacity>

                {/* Enhanced Pagination Dots */}
                <View style={styles.paginationContainer}>
                    <View style={styles.dotActive}>
                        <View style={styles.dotInner} />
                    </View>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafb',
    },
    header: {
        backgroundColor: 'white',
        paddingTop: 40,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e8ecef',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 10,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#2c3e50',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    headerUnderline: {
        width: 40,
        height: 3,
        backgroundColor: '#099928ff',
        borderRadius: 2,
        marginTop: 4,
    },
    profileButton: {
        position: 'relative',
        marginLeft: 10,
    },
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#099928ff',
        backgroundColor: '#f0f0f0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#099928ff',
        borderWidth: 2,
        borderColor: 'white',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        padding: 20,
        paddingTop: 40,
        paddingBottom: 40,
    },
    pageTitleContainer: {
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 30,
    },
    titleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e8f8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 6,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#fafbfc',
        borderBottomWidth: 2,
        borderBottomColor: '#e8f8f0',
    },
    sectionIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#e8f8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    specialIconWrapper: {
        backgroundColor: '#fef5e7',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    badge: {
        backgroundColor: '#099928ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 28,
        alignItems: 'center',
    },
    badgeSpecial: {
        backgroundColor: '#f39c12',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
    },
    tableHeaderText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scheduleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f3f5',
    },
    lastCard: {
        borderBottomWidth: 0,
    },
    dateTimeContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafb',
        borderRadius: 12,
        padding: 14,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e8ecef',
    },
    dateIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#e8f8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    specialDateIcon: {
        backgroundColor: '#fef5e7',
    },
    dateTimeText: {
        flex: 1,
    },
    dateText: {
        fontSize: 13,
        color: '#2c3e50',
        fontWeight: '600',
        marginBottom: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginLeft: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeInProgress: {
        backgroundColor: '#e8f8f0',
    },
    statusBadgePending: {
        backgroundColor: '#fef5e7',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    dotInProgress: {
        backgroundColor: '#099928ff',
    },
    dotPending: {
        backgroundColor: '#f39c12',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusInProgress: {
        color: '#27ae60',
    },
    statusPending: {
        color: '#e67e22',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingSpinner: {
        marginBottom: 12,
    },
    loadingText: {
        color: '#7f8c8d',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 13,
    },
    addButton: {
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#099928ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    addButtonGradient: {
        flexDirection: 'row',
        backgroundColor: '#099928ff',
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#d5dbdb',
    },
    dotActive: {
        width: 28,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#099928ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    
});

export default ScheduleScreen;