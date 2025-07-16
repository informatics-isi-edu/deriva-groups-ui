import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI, Group } from '../../../shared/utils/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import CreateGroupModal from '../components/CreateGroupModal';
import {
  PlusIcon,
  UserGroupIcon,
  UsersIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsAPI.listGroups(filter === 'my');
      setGroups(response.data.groups);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      toast.error(error.userMessage || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    loadGroups();
    toast.success('Group created successfully!');
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="mt-2 text-gray-600">Manage your group memberships and create new groups.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Create Group
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'my')}
            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Groups</option>
            <option value="my">My Groups</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              All Groups
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`${
                filter === 'my'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <UserGroupIcon className="h-4 w-4 mr-2" />
              My Groups
            </button>
          </nav>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'my' ? 'No groups yet' : 'No groups found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'my' 
              ? 'Get started by creating a group or accepting an invitation.'
              : 'There are no groups available at the moment.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
              Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{group.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.visibility === 'public' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {group.visibility === 'public' ? 'Public' : 'Private'}
                        </span>
                      </div>
                      {group.membership && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(group.membership.role)}`}>
                          {group.membership.role}
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  <span>{group.member_count || 0} members</span>
                  <span className="mx-2">•</span>
                  <span>Created {format(new Date(group.created_at), 'MMM d, yyyy')}</span>
                </div>

                <div className="mt-6">
                  <Link
                    to={`/detail/${group.id}`}
                    className="w-full btn-primary text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
};

export default Groups;