import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleListScreen({ route, navigation }) {
  const { schedules } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'scheduled', 'in-progress', 'completed'

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, you'd fetch new data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'all') return true;
    return schedule.status === filter;
  });

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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

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

  const FilterButton = ({ status, label, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === status && styles.filterButtonActive
      ]}
      onPress={() => setFilter(status)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === status && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>All Schedules</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filter by Status</Text>
          <View style={styles.filterContainer}>
            <FilterButton 
              status="all" 
              label="All" 
              count={schedules.length} 
            />
            <FilterButton 
              status="scheduled" 
              label="Scheduled" 
              count={schedules.filter(s => s.status === 'scheduled').length} 
            />
            <FilterButton 
              status="in-progress" 
              label="In Progress" 
              count={schedules.filter(s => s.status === 'in-progress').length} 
            />
            <FilterButton 
              status="completed" 
              label="Completed" 
              count={schedules.filter(s => s.status === 'completed').length} 
            />
          </View>
        </View>

        {/* Schedules List */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>
            {filter === 'all' ? 'All Schedules' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Schedules`} 
            ({filteredSchedules.length})
          </Text>

          {filteredSchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>
                {filter === 'all' ? 'No schedules found' : `No ${filter} schedules`}
              </Text>
            </View>
          ) : (
            filteredSchedules.map((schedule, index) => (
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
                        {getBinTypes(schedule)} • {schedule.collectionType || 'regular'}
                      </Text>
                      <Text style={styles.scheduleDate}>
                        {formatDate(schedule.scheduledDate)}
                      </Text>
                    </View>
                    <Text style={styles.scheduleAddress}>
                      {getFirstBinLocation(schedule)}
                    </Text>
                    <Text style={styles.scheduleTime}>
                      {formatTimeSlot(schedule.timeSlot)}
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

                {schedule.collectedAt && (
                  <View style={styles.collectedInfo}>
                    <Ionicons name="time" size={14} color="#7f8c8d" />
                    <Text style={styles.collectedText}>
                      Collected: {new Date(schedule.collectedAt).toLocaleString()}
                    </Text>
                  </View>
                )}

                {schedule.rejectedReason && (
                  <View style={styles.rejectedInfo}>
                    <Ionicons name="alert-circle" size={14} color="#e74c3c" />
                    <Text style={styles.rejectedText}>
                      Reason: {schedule.rejectedReason}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#0e5cecff',
    borderColor: '#0e5cecff',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scheduleSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
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
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
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
  scheduleDate: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  scheduleAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
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
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
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
    marginBottom: 8,
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
  collectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  collectedText: {
    fontSize: 10,
    color: '#3498db',
    marginLeft: 4,
  },
  rejectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8e8',
    padding: 6,
    borderRadius: 4,
  },
  rejectedText: {
    fontSize: 10,
    color: '#e74c3c',
    marginLeft: 4,
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
});