import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { groupsAPI, Group, GroupInvitation } from '../../../shared/utils/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import {
  UserGroupIcon,
  PlusIcon,
  InboxIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<GroupInvitation[]>([]);
  const [stats, setStats] = useState({
    totalGroups: 0,
    memberGroups: 0,
    adminGroups: 0,
    pendingInvitations: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user's groups
      const groupsResponse = await groupsAPI.listGroups(true);
      const userGroups = groupsResponse.data.groups;
      
      // Load pending invitations
      const invitationsResponse = await groupsAPI.getPendingInvitations();
      const invitations = invitationsResponse.data.invitations;
      
      // Calculate stats
      const adminGroups = userGroups.filter(g => g.membership?.role === 'administrator');
      const memberGroups = userGroups.filter(g => g.membership?.role === 'member');
      
      setRecentGroups(userGroups.slice(0, 5)); // Show 5 most recent
      setPendingInvitations(invitations.slice(0, 3)); // Show 3 most recent
      setStats({
        totalGroups: userGroups.length,
        memberGroups: memberGroups.length,
        adminGroups: adminGroups.length,
        pendingInvitations: invitations.length,
      });
      
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error(error.userMessage || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      await groupsAPI.acceptInvitation(token);
      toast.success('Invitation accepted successfully!');
      loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      toast.error(error.userMessage || 'Failed to accept invitation');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="large" className="mt-20" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name || user?.email}</h1>
        <p className="mt-2 text-gray-600">Here's an overview of your group memberships and activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Groups</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalGroups}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Admin Groups</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.adminGroups}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Member Groups</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.memberGroups}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <InboxIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Invitations</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingInvitations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Groups */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Your Groups</h2>
              <Link
                to="/detail"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {recentGroups.length === 0 ? (
              <div className="text-center py-6">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a group or accepting an invitation.</p>
                <div className="mt-6">
                  <Link
                    to="/detail"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                    Create Group
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGroups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.visibility === 'public' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {group.visibility === 'public' ? 'Public' : 'Private'}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.membership?.role === 'administrator' 
                            ? 'bg-purple-100 text-purple-800'
                            : group.membership?.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {group.membership?.role}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                      )}
                    </div>
                    <Link
                      to={`/detail/${group.id}`}
                      className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Pending Invitations</h2>
              <Link
                to="/invitations"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {pendingInvitations.length === 0 ? (
              <div className="text-center py-6">
                <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
                <p className="mt-1 text-sm text-gray-500">You'll see group invitations here when you receive them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {invitation.group?.name || 'Group Invitation'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Role: <span className="font-medium">{invitation.role}</span>
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Expires {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <button
                        onClick={() => acceptInvitation(invitation.token)}
                        className="ml-3 btn-primary text-xs"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;