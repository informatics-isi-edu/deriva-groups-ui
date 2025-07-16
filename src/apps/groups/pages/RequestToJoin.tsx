import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { joinRequestsAPI, groupsAPI } from '../../../shared/utils/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface JoinInfo {
  group_name: string;
  group_description: string;
  is_valid: boolean;
  expires_at: string;
}

const RequestToJoin: React.FC = () => {
  const { token, groupId } = useParams<{ token?: string; groupId?: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token || groupId) {
      loadJoinInfo();
    }
  }, [token, groupId]);

  const loadJoinInfo = async () => {
    if (!token && !groupId) return;

    try {
      setLoading(true);
      setError(null);
      
      if (token) {
        // Loading join info by token (existing flow)
        const response = await joinRequestsAPI.getJoinInfo(token);
        setJoinInfo(response.data);
      } else if (groupId) {
        // Loading group info by group ID (new flow) - use public endpoint
        const response = await groupsAPI.getPublicGroupInfo(groupId);
        const group = response.data;
        setJoinInfo({
          group_name: group.name,
          group_description: group.description,
          is_valid: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        });
      }
    } catch (error: any) {
      console.error('Failed to load join info:', error);
      if (error.response?.status === 404) {
        setError(groupId ? 'This group does not exist.' : 'This join link is invalid or has expired.');
      } else {
        setError(error.userMessage || 'Failed to load group information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async () => {
    if ((!token && !groupId) || !user) return;

    try {
      setSubmitting(true);
      
      if (token) {
        // Join via token (existing flow)
        await joinRequestsAPI.requestToJoinViaToken(token, { message: message.trim() });
      } else if (groupId) {
        // Join via group ID (new flow)
        await joinRequestsAPI.createJoinRequest(groupId, { message: message.trim() });
      }
      
      toast.success('Join request submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to submit join request:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.userMessage || 'Failed to submit join request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = () => {
    login(window.location.href);
  };

  const isExpired = joinInfo && new Date(joinInfo.expires_at) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !joinInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Join Link</h2>
            <p className="text-gray-600 mb-6">
              {error || 'This join link is not valid or has expired.'}
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
            Request to Join Group
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Submit a request to join this group
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {joinInfo.group_name}
            </h3>
            {joinInfo.group_description && (
              <p className="text-gray-600 mb-4">
                {joinInfo.group_description}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>
                {isExpired 
                  ? `Expired ${format(new Date(joinInfo.expires_at), 'MMM d, yyyy')}`
                  : `Valid until ${format(new Date(joinInfo.expires_at), 'MMM d, yyyy')}`
                }
              </span>
            </div>
          </div>

          {isExpired ? (
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-red-600 font-medium mb-4">This join link has expired</p>
              <p className="text-sm text-gray-500 mb-4">
                Please contact the group administrators for assistance.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary w-full"
              >
                Go to Dashboard
              </button>
            </div>
          ) : !joinInfo.is_valid ? (
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-red-600 font-medium mb-4">This join link is no longer valid</p>
              <p className="text-sm text-gray-500 mb-4">
                The link may have been disabled or already used.
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
                You need to sign in to request to join this group.
              </p>
              <button
                onClick={handleLogin}
                className="btn-primary w-full"
              >
                Sign In to Continue
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <label htmlFor="message" className="form-label">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-input"
                  placeholder="Tell the group administrators why you'd like to join..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  This message will be sent to group administrators with your request.
                </p>
              </div>

              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-gray-600 mb-6">
                  Ready to request to join <strong>{joinInfo.group_name}</strong>?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleRequestToJoin}
                    disabled={submitting}
                    className="btn-primary w-full"
                  >
                    {submitting ? 'Submitting Request...' : 'Submit Join Request'}
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-secondary w-full"
                  >
                    Cancel
                  </button>
                </div>
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

export default RequestToJoin;