import React, { useState, useEffect } from 'react';
import { groupsAPI, GroupInvitation } from '../../../shared/utils/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import {
  InboxIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Invitations: React.FC = () => {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await groupsAPI.getPendingInvitations();
      setInvitations(response.data.invitations);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
      toast.error(error.userMessage || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      await groupsAPI.acceptInvitation(token);
      toast.success('Invitation accepted successfully!');
      loadInvitations(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      toast.error(error.userMessage || 'Failed to accept invitation');
    }
  };

  const getRoleBadgeClass = (role: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'expired':
      case 'revoked':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      case 'revoked':
        return 'Revoked';
      default:
        return status;
    }
  };

  const isInvitationExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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
        <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
        <p className="mt-2 text-gray-600">Manage your group invitations and join new communities.</p>
      </div>

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any pending group invitations at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {invitations.map((invitation) => {
              const isExpired = isInvitationExpired(invitation.expires_at);
              const canAccept = invitation.status === 'pending' && !isExpired;

              return (
                <li key={invitation.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(invitation.status)}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-lg font-medium text-gray-900 truncate">
                              {invitation.group?.name || 'Group Invitation'}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(invitation.role)}`}>
                              {invitation.role}
                            </span>
                          </div>
                          {invitation.group?.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {invitation.group.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <span>
                              Invited {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                              {' • '}
                              {isExpired ? 'Expired' : `Expires ${format(new Date(invitation.expires_at), 'MMM d, yyyy')}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invitation.status === 'pending' 
                            ? isExpired 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                            : invitation.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isExpired && invitation.status === 'pending' ? 'Expired' : getStatusText(invitation.status)}
                        </span>
                        {canAccept && (
                          <button
                            onClick={() => acceptInvitation(invitation.token)}
                            className="btn-success text-sm"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-3 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Email: {invitation.email}
                        </p>
                      </div>
                      {invitation.status === 'pending' && !isExpired && (
                        <div className="mt-2 sm:mt-0">
                          <p className="text-sm text-gray-500">
                            You will be added as a <span className="font-medium">{invitation.role}</span> when you accept this invitation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Invitations;