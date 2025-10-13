import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;

// Ongoing Schedules සඳහා Mock Data
const ongoingMockData = [
    { id: '1', date: '15 October 2025', time: '11:00 AM', status: 'In progress' },
    { id: '2', date: '16 October 2025', time: '11:00 AM', status: 'Pending' },
    { id: '3', date: '17 October 2025', time: '11:00 AM', status: 'Pending' },
];

// FlatList එකට ඉහළින් පෙන්වන සියලුම දේවල් මෙම Header Component එකට ඇතුළත් කිරීම
const ListHeader = ({ userDetails }) => (
    <>
        <Text style={styles.title}>Welcome Manager!</Text>
        <Text style={styles.greeting}>{userDetails.email}</Text>

        {/* Ongoing Schedules (Mock Data) */}
        <View style={styles.listContainer}>
            <Text style={styles.listHeader}>Ongoing Regular Schedules</Text>
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

        {/* Special Collections ලැයිස්තුව සඳහා தலைப்பு */}
        <Text style={[styles.listHeader, { marginTop: 20, marginLeft: 15 }]}>
            All Users Special Collection Schedules
        </Text>
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
        <View style={styles.scheduleItem}>
            <View>
                <Text style={styles.itemDate}>{new Date(item.date).toDateString()}</Text>
                <Text style={styles.itemTime}>{item.timeSlot}</Text>
                <Text style={styles.itemUser}>{item.user.email}</Text>
            </View>
            <Text style={[
                styles.itemStatus,
                item.status === 'Pending' ? styles.statusPending : styles.statusInProgress
            ]}>
                {item.status}
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
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
                        <Button title="Logout" onPress={handleLogout} color="#ff5c5c" />
                    </View>
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No special schedules found.</Text>}
                contentContainerStyle={styles.container}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    greeting: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2c3e50',
    },
    scheduleItem: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemDate: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemTime: {
        fontSize: 14,
        color: '#555',
    },
    itemUser: {
        fontSize: 12,
        color: '#7f8c8d',
        fontStyle: 'italic',
        marginTop: 4,
    },
    itemStatus: {
        fontSize: 14,
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
        marginTop: 20,
        color: '#777',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    buttonContainer: {
        marginTop: 30,
        alignSelf: 'center',
        width: '60%',
    }
});

export default ManagerScreen;