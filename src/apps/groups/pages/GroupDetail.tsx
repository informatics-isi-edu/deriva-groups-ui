import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { groupsAPI, Group, GroupMembership, GroupInvitation, joinRequestsAPI, JoinRequest } from '../../../shared/utils/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import InviteMemberModal from '../components/InviteMemberModal';
import EditGroupModal from '../components/EditGroupModal';
import {
  UsersIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uiBasePath = '/deriva/apps/groups'

  // Helper function to get the correct UI base URL for join links
  const getJoinLinkBase = () => {
    if (typeof window !== 'undefined') {
      // Use environment variable for UI base path
      const basePath = import.meta.env.VITE_UI_BASE_PATH || uiBasePath;
      return `${window.location.origin}${basePath}`;
    }
    return `${window.location.origin}${uiBasePath}`;
  };

  const getUserInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'requests'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      
      // Load group details
      const groupResponse = await groupsAPI.getGroup(groupId);
      setGroup(groupResponse.data);
      
      // Load members
      const membersResponse = await groupsAPI.getGroupMembers(groupId);
      setMembers(membersResponse.data.members);
      
      // Load invitations if user can manage the group
      const userMembership = groupResponse.data.membership;
      if (userMembership && (userMembership.role === 'administrator' || userMembership.role === 'manager')) {
        const invitationsResponse = await groupsAPI.getGroupInvitations(groupId);
        setInvitations(invitationsResponse.data.invitations);
        
        // Load join requests
        const joinRequestsResponse = await joinRequestsAPI.getGroupJoinRequests(groupId);
        setJoinRequests(joinRequestsResponse.data.join_requests);
      }
      
    } catch (error: any) {
      console.error('Failed to load group data:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this group');
        navigate('/detail');
      } else if (error.response?.status === 404) {
        toast.error('Group not found');
        navigate('/detail');
      } else {
        toast.error(error.userMessage || 'Failed to load group data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await groupsAPI.deleteGroup(group.id);
      toast.success('Group deleted successfully');
      navigate('/detail');
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      toast.error(error.userMessage || 'Failed to delete group');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!group || !window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await groupsAPI.removeGroupMember(group.id, userId);
      toast.success('Member removed successfully');
      loadGroupData();
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error(error.userMessage || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!group) return;
    
    try {
      await groupsAPI.updateMemberRole(group.id, userId, newRole);
      toast.success('Member role updated successfully');
      loadGroupData();
    } catch (error: any) {
      console.error('Failed to update member role:', error);
      toast.error(error.userMessage || 'Failed to update member role');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!group || !window.confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }
    
    try {
      await groupsAPI.revokeInvitation(group.id, invitationId);
      toast.success('Invitation revoked successfully');
      loadGroupData();
    } catch (error: any) {
      console.error('Failed to revoke invitation:', error);
      toast.error(error.userMessage || 'Failed to revoke invitation');
    }
  };

  const handleApproveJoinRequest = async (requestId: string, role: string = 'member') => {
    if (!group) return;
    
    try {
      await joinRequestsAPI.approveJoinRequest(group.id, requestId, { role });
      toast.success('Join request approved successfully');
      loadGroupData();
    } catch (error: any) {
      console.error('Failed to approve join request:', error);
      toast.error(error.userMessage || 'Failed to approve join request');
    }
  };

  const handleDenyJoinRequest = async (requestId: string, comment: string = '') => {
    if (!group || !window.confirm('Are you sure you want to deny this join request?')) {
      return;
    }
    
    try {
      await joinRequestsAPI.denyJoinRequest(group.id, requestId, { comment });
      toast.success('Join request denied successfully');
      loadGroupData();
    } catch (error: any) {
      console.error('Failed to deny join request:', error);
      toast.error(error.userMessage || 'Failed to deny join request');
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageGroup = group?.membership?.role === 'administrator' || group?.membership?.role === 'manager';
  const canAdminGroup = group?.membership?.role === 'administrator';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="large" className="mt-20" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Group not found</h3>
          <p className="mt-1 text-sm text-gray-500">The group you're looking for doesn't exist or you don't have access.</p>
          <div className="mt-6">
            <Link to="/detail" className="btn-primary">
              Back to Groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/detail"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Groups
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  group.visibility === 'public' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.visibility === 'public' ? 'Public' : 'Private'}
                </span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(group.membership?.role || '')}`}>
                  {group.membership?.role}
                </span>
              </div>
              {group.description && (
                <p className="mt-2 text-gray-600">{group.description}</p>
              )}
              <div className="mt-2 text-sm text-gray-500">
                Created {format(new Date(group.created_at), 'MMM d, yyyy')} • {members.length} members
              </div>
            </div>
            
            {canManageGroup && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn-primary"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Invite Member
                </button>
                
                <Menu as="div" className="relative">
                  <Menu.Button className="btn-secondary">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </Menu.Button>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {canAdminGroup && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setShowEditModal(true)}
                              className={`${active ? 'bg-gray-100' : ''} flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <PencilIcon className="mr-3 h-4 w-4" />
                              Edit Group
                            </button>
                          )}
                        </Menu.Item>
                      )}
                      {canAdminGroup && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleDeleteGroup}
                              className={`${active ? 'bg-gray-100' : ''} flex w-full items-center px-4 py-2 text-sm text-red-700`}
                            >
                              <TrashIcon className="mr-3 h-4 w-4" />
                              Delete Group
                            </button>
                          )}
                        </Menu.Item>
                      )}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Link Section - Show for public groups */}
      {group.visibility === 'public' && canManageGroup && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share Join Link</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 border border-blue-200 rounded text-blue-800">
                  {getJoinLinkBase()}/join-group/{group.id}
                </code>
                <button
                  onClick={() => {
                    const joinLink = `${getJoinLinkBase()}/join-group/${group.id}`;
                    navigator.clipboard.writeText(joinLink).then(() => {
                      toast.success('Join link copied to clipboard!');
                    }).catch(() => {
                      toast.error('Failed to copy link');
                    });
                  }}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy Link
                </button>
              </div>
              <p className="mt-2 text-sm text-blue-600">
                Anyone with this link can request to join this public group.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`${
                activeTab === 'members'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              Members ({members.length})
            </button>
            {canManageGroup && (
              <button
                onClick={() => setActiveTab('invitations')}
                className={`${
                  activeTab === 'invitations'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Invitations ({invitations.length})
              </button>
            )}
            {canManageGroup && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`${
                  activeTab === 'requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <InboxIcon className="h-4 w-4 mr-2" />
                Join Requests ({joinRequests.length})
              </button>
            )}
          </nav>
        </div>

        <div className="px-6 py-4">
          {activeTab === 'members' && (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {getUserInitials(member.user_email)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.user_email}</div>
                      <div className="text-sm text-gray-500">
                        Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                    {canManageGroup && member.user_id !== user?.id && (
                      <Menu as="div" className="relative">
                        <Menu.Button className="text-gray-400 hover:text-gray-600">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </Menu.Button>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {canAdminGroup && member.role !== 'administrator' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUpdateRole(member.user_id, 'administrator')}
                                    className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                  >
                                    Make Administrator
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {member.role !== 'manager' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUpdateRole(member.user_id, 'manager')}
                                    className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                  >
                                    Make Manager
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {member.role !== 'member' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUpdateRole(member.user_id, 'member')}
                                    className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                  >
                                    Make Member
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleRemoveMember(member.user_id)}
                                  className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-red-700 w-full text-left`}
                                >
                                  Remove from Group
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {invitations.length === 0 ? (
                <div className="text-center py-6">
                  <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
                  <p className="mt-1 text-sm text-gray-500">Invite new members to get started.</p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                      <div className="text-sm text-gray-500">
                        Invited {format(new Date(invitation.created_at), 'MMM d, yyyy')} • 
                        Expires {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(invitation.role)}`}>
                        {invitation.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invitation.status)}`}>
                        {invitation.status}
                      </span>
                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-500 text-sm"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {joinRequests.length === 0 ? (
                <div className="text-center py-6">
                  <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No join requests</h3>
                  <p className="mt-1 text-sm text-gray-500">No one has requested to join this group yet.</p>
                </div>
              ) : (
                joinRequests.map((request) => (
                  <div key={request.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{request.user_name || request.user_email}</div>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{request.user_email}</div>
                      {request.message && (
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Message:</strong> {request.message}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </div>
                      {request.reviewed_at && (
                        <div className="text-sm text-gray-500">
                          {request.status === 'approved' ? 'Approved' : 'Denied'} {format(new Date(request.reviewed_at), 'MMM d, yyyy')}
                          {request.reviewer_comment && (
                            <div className="mt-1 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Comment:</strong> {request.reviewer_comment}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Menu as="div" className="relative">
                          <Menu.Button className="btn-success text-sm">
                            Approve
                          </Menu.Button>
                          <Transition
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleApproveJoinRequest(request.id, 'member')}
                                    className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                  >
                                    Approve as Member
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleApproveJoinRequest(request.id, 'manager')}
                                    className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                  >
                                    Approve as Manager
                                  </button>
                                )}
                              </Menu.Item>
                              {canAdminGroup && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleApproveJoinRequest(request.id, 'administrator')}
                                      className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                    >
                                      Approve as Administrator
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </Menu.Items>
                          </Transition>
                        </Menu>
                        <button
                          onClick={() => handleDenyJoinRequest(request.id)}
                          className="btn-danger text-sm"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setShowInviteModal(false);
          loadGroupData();
        }}
        groupId={group.id}
      />

      <EditGroupModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          loadGroupData();
        }}
        group={group}
      />
    </div>
  );
};

export default GroupDetail;