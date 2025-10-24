import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/collector`;

export default function CollectorDashboard({ route, navigation }) {
  const { userDetails } = route.params;
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0
  });

  // Helper functions for multiple bins
  const getBinNames = (schedule) => {
    if (!schedule.bins || schedule.bins.length === 0) {
      return 'Unknown Bin';
    }
    
    if (schedule.bins.length === 1) {
      return schedule.bins[0].binName || 'Unknown Bin';
    }
    
    return `${schedule.bins.length} Bins`;
  };

  const getBinTypes = (schedule) => {
    if (!schedule.bins || schedule.bins.length === 0) {
      return 'Unknown';
    }
    
    const types = [...new Set(schedule.bins.map(bin => bin.binType))];
    return types.join(', ');
  };

  const getFirstBinLocation = (schedule) => {
    if (!schedule.bins || schedule.bins.length === 0) {
      return 'No address specified';
    }
    
    return schedule.bins[0].location?.address || 'No address specified';
  };

  const getTotalCapacity = (schedule) => {
    if (!schedule.bins || schedule.bins.length === 0) {
      return 0;
    }
    
    return schedule.bins.reduce((total, bin) => total + (bin.capacity || 0), 0);
  };

  const loadTodaySchedules = async () => {
    try {
      setLoading(true);
      console.log('Loading schedules from:', `${API_URL}/schedules`);
      
      const response = await axios.get(`${API_URL}/schedules`);
      console.log('Schedules response:', response.data);
      
      // Handle both response formats
      const schedules = response.data.data || response.data;
      setTodaySchedules(Array.isArray(schedules) ? schedules : []);
      
      // Calculate stats
      const total = schedules.length || 0;
      const completed = schedules.filter(item => item.status === 'completed').length;
      const inProgress = schedules.filter(item => item.status === 'in-progress').length;
      const pending = total - completed - inProgress;
      
      setStats({ total, completed, pending, inProgress });
    } catch (error) {
      console.error('Error loading schedules:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load schedules. Please check your connection.');
      setTodaySchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodaySchedules();
    setRefreshing(false);
  };

  const handleStartCollection = async (schedule) => {
    try {
      console.log('Starting collection for schedule:', schedule._id);
      
      const response = await axios.put(`${API_URL}/update-status`, {
        scheduleId: schedule._id,
        status: 'in-progress'
      });
      
      if (response.data.success) {
        Alert.alert('Started', 'Collection marked as in progress');
        loadTodaySchedules(); // Refresh data
      } else {
        Alert.alert('Error', response.data.message || 'Failed to start collection');
      }
    } catch (error) {
      console.error('Error starting collection:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to start collection. Please try again.');
    }
  };

  // ADD THIS FUNCTION: Navigation to Map
  const handleNavigateToLocation = (schedule) => {
    navigation.navigate('CollectorMap', { 
      userDetails,
      schedule 
    });
  };

  const handleRejectCollection = (schedule) => {
    Alert.prompt(
      'Reject Collection',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Please provide a rejection reason');
              return;
            }

            try {
              const response = await axios.put(`${API_URL}/reject-collection`, {
                scheduleId: schedule._id,
                reason: reason
              });

              if (response.data.success) {
                Alert.alert('Rejected', 'Collection has been rejected');
                loadTodaySchedules();
              } else {
                Alert.alert('Error', response.data.message || 'Failed to reject collection');
              }
            } catch (error) {
              console.error('Error rejecting collection:', error.response?.data || error.message);
              Alert.alert('Error', 'Failed to reject collection. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in-progress': return '#f39c12';
      case 'scheduled': return '#3498db';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'time';
      case 'scheduled': return 'calendar';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatTimeSlot = (timeSlot) => {
    return timeSlot || 'Not specified';
  };

  useEffect(() => {
    loadTodaySchedules();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Collector Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {userDetails?.email}</Text>
        </View>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => navigation.navigate('QRScanner', { userDetails })}
        >
          <Ionicons name="qr-code" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer} // FIXED: Added contentContainerStyle
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading schedules...</Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="list" size={24} color="#3498db" />
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#f39c12" />
                <Text style={styles.statNumber}>{stats.inProgress}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="alert-circle" size={24} color="#e74c3c" />
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('ScheduleList', { schedules: todaySchedules })}
              >
                <Ionicons name="list" size={24} color="#fff" />
                <Text style={styles.actionText}>View All</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('QRScanner', { userDetails })}
              >
                <Ionicons name="qr-code" size={24} color="#fff" />
                <Text style={styles.actionText}>Scan QR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={loadTodaySchedules}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.actionText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* Today's Schedule */}
            <View style={styles.scheduleSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Today's Schedule ({todaySchedules.length})
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>

              {todaySchedules.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>No schedules for today</Text>
                  <Text style={styles.emptyStateSubtext}>
                    All collections for today have been completed or no schedules assigned.
                  </Text>
                </View>
              ) : (
                todaySchedules.map((schedule, index) => (
                  <View key={schedule._id || index} style={styles.scheduleCard}>
                    <View style={styles.scheduleHeader}>
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.customerName}>
                          {schedule.user?.email || 'Unknown Customer'}
                        </Text>
                        <Text style={styles.binName}>
                          {getBinNames(schedule)}
                        </Text>
                        <View style={styles.scheduleDetails}>
                          <Text style={styles.binType}>
                            {getBinTypes(schedule)} • {getTotalCapacity(schedule)}L
                          </Text>
                          <Text style={styles.scheduleTime}>
                            {formatTimeSlot(schedule.timeSlot)}
                          </Text>
                        </View>
                        <Text style={styles.scheduleAddress}>
                          {getFirstBinLocation(schedule)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                        <Ionicons 
                          name={getStatusIcon(schedule.status)} 
                          size={14} 
                          color="#fff" 
                        />
                        <Text style={styles.statusText}>{schedule.status}</Text>
                      </View>
                    </View>

                    {/* UPDATED: Schedule Actions with Navigation */}
                    <View style={styles.scheduleActions}>
                      {schedule.status === 'scheduled' && (
                        <>
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.navigateBtn]}
                            onPress={() => handleNavigateToLocation(schedule)}
                          >
                            <Ionicons name="navigate" size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>Navigate</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.startBtn]}
                            onPress={() => handleStartCollection(schedule)}
                          >
                            <Ionicons name="play" size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>Start</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleRejectCollection(schedule)}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {schedule.status === 'in-progress' && (
                        <>
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.navigateBtn]}
                            onPress={() => handleNavigateToLocation(schedule)}
                          >
                            <Ionicons name="navigate" size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>Navigate</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.completeBtn]}
                            onPress={() => navigation.navigate('QRScanner', { 
                              userDetails,
                              schedule // Pass schedule data to QR scanner
                            })}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.actionBtnText}>Complete</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {schedule.status === 'completed' && (
                        <View style={styles.completedInfo}>
                          <Ionicons name="checkmark-done" size={16} color="#27ae60" />
                          <Text style={styles.completedText}>
                            Completed at {schedule.collectedAt ? 
                              new Date(schedule.collectedAt).toLocaleTimeString() : 
                              'Unknown time'
                            }
                          </Text>
                        </View>
                      )}

                      {schedule.status === 'rejected' && (
                        <View style={styles.rejectedInfo}>
                          <Ionicons name="close-circle" size={16} color="#e74c3c" />
                          <Text style={styles.rejectedText}>
                            Rejected: {schedule.rejectedReason || 'No reason provided'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {schedule.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Collector Notes:</Text>
                        <Text style={styles.notesText}>{schedule.notes}</Text>
                      </View>
                    )}

                    {schedule.wasteLevel > 0 && (
                      <View style={styles.wasteLevelContainer}>
                        <Text style={styles.wasteLevelLabel}>Waste Level Collected:</Text>
                        <View style={styles.wasteLevelBar}>
                          <View 
                            style={[
                              styles.wasteLevelFill, 
                              { width: `${schedule.wasteLevel}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.wasteLevelText}>{schedule.wasteLevel}%</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0e5cecff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  scanButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    // FIXED: Add any layout styles that should apply to ScrollView content here
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  // ... rest of your styles remain the same
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#099928ff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
  scheduleSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  binName: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 4,
  },
  scheduleAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  binType: {
    fontSize: 12,
    color: '#7f8c8d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  scheduleTime: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  navigateBtn: {
    backgroundColor: '#9b59b6',
  },
  startBtn: {
    backgroundColor: '#3498db',
  },
  completeBtn: {
    backgroundColor: '#27ae60',
  },
  rejectBtn: {
    backgroundColor: '#e74c3c',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d5f4e6',
    padding: 8,
    borderRadius: 6,
  },
  completedText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 4,
    fontWeight: '500',
  },
  rejectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fadbd8',
    padding: 8,
    borderRadius: 6,
  },
  rejectedText: {
    fontSize: 12,
    color: '#e74c3c',
    marginLeft: 4,
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  wasteLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  wasteLevelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7f8c8d',
    marginRight: 8,
  },
  wasteLevelBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  wasteLevelFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 3,
  },
  wasteLevelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2c3e50',
    minWidth: 25,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 4,
    textAlign: 'center',
  },
});