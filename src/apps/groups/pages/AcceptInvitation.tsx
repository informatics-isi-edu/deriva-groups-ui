import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { groupsAPI } from '../../../shared/utils/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface InvitationInfo {
  group_name: string;
  group_description: string;
  role: string;
  expires_at: string;
  is_valid: boolean;
}

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitationInfo();
    }
  }, [token]);

  const loadInvitationInfo = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await groupsAPI.getInvitationInfo(token);
      setInvitationInfo(response.data);
    } catch (error: any) {
      console.error('Failed to load invitation info:', error);
      if (error.response?.status === 404) {
        setError('This invitation is invalid or has expired.');
      } else {
        setError(error.userMessage || 'Failed to load invitation information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || !user) return;

    try {
      setAccepting(true);
      await groupsAPI.acceptInvitation(token);
      toast.success('Invitation accepted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      toast.error(error.userMessage || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    login(window.location.href);
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

  const isExpired = invitationInfo && new Date(invitationInfo.expires_at) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !invitationInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              {error || 'This invitation link is not valid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Group Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join a group
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {invitationInfo.group_name}
            </h3>
            {invitationInfo.group_description && (
              <p className="text-gray-600 mb-4">
                {invitationInfo.group_description}
              </p>
            )}
            <div className="flex items-center justify-center space-x-3">
              <span className="text-sm text-gray-500">Role:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(invitationInfo.role)}`}>
                {invitationInfo.role}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>
                {isExpired 
                  ? `Expired ${format(new Date(invitationInfo.expires_at), 'MMM d, yyyy')}`
                  : `Expires ${format(new Date(invitationInfo.expires_at), 'MMM d, yyyy')}`
                }
              </span>
            </div>
          </div>

          {isExpired ? (
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-red-600 font-medium mb-4">This invitation has expired</p>
              <p className="text-sm text-gray-500 mb-4">
                Please contact the group administrator for a new invitation.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary w-full"
              >
                Go to Dashboard
              </button>
            </div>
          ) : !invitationInfo.is_valid ? (
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-red-600 font-medium mb-4">This invitation is no longer valid</p>
              <p className="text-sm text-gray-500 mb-4">
                The invitation may have been revoked or already accepted.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary w-full"
              >
                Go to Dashboard
              </button>
            </div>
          ) : !user ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                You need to sign in to accept this invitation.
              </p>
              <button
                onClick={handleLogin}
                className="btn-primary w-full"
              >
                Sign In to Accept
              </button>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-gray-600 mb-6">
                Ready to join <strong>{invitationInfo.group_name}</strong> as a <strong>{invitationInfo.role}</strong>?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="btn-success w-full"
                >
                  {accepting ? 'Accepting...' : 'Accept Invitation'}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary w-full"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            DERIVA Group Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;