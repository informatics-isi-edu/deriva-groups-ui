import axios, { AxiosInstance } from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;

// Get API base URL from environment variables
const getApiBaseUrl = () => {
  // Use environment variables for API URL configuration
  const apiBasePath = import.meta.env.VITE_API_BASE_PATH || '/groups';
  
  // For development, use VITE_BACKEND_URL if available
  if (import.meta.env.MODE === 'development' && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // For production, construct URL from base URL and API path
  return `${baseUrl}${apiBasePath}`;
};

const API_BASE_URL = getApiBaseUrl();

// Get API base URL from environment variables
const getAuthApiBaseUrl = () => {
  // Use environment variables for API URL configuration
  const authApiBasePath = import.meta.env.VITE_AUTH_API_BASE_PATH || '/authn';

  // For development, use VITE_AUTH_URL if available
  if (import.meta.env.MODE === 'development' && import.meta.env.VITE_AUTH_URL) {
    return import.meta.env.VITE_AUTH_URL;
  }
  // For production, construct URL from base URL and API path
  return `${baseUrl}${authApiBasePath}`;
};

const AUTH_API_BASE_URL = getAuthApiBaseUrl();

// Create groups API axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for session authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create auth API axios instance
const auth = axios.create({
  baseURL: AUTH_API_BASE_URL,
  withCredentials: true, // Include cookies for session authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to apply common interceptors to any axios instance
const setupInterceptors = (axiosInstance: AxiosInstance, authBaseUrl: string) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.href = `${authBaseUrl}/login?referrer=${encodeURIComponent(window.location.href)}`;
        return Promise.reject(error);
      }

      let userMessage = 'An unexpected error occurred';
      if (error.response?.data) {
        userMessage = error.response.data.message ||
                     error.response.data.error ||
                     error.response.data.detail ||
                     `Server error (${error.response.status})`;
      } else if (error.request) {
        userMessage = 'Unable to connect to server. Please check your internet connection.';
      }

      error.userMessage = userMessage;
      return Promise.reject(error);
    }
  );
};

// Apply to both instances
setupInterceptors(api, AUTH_API_BASE_URL);
setupInterceptors(auth, AUTH_API_BASE_URL);

// Types
export interface User {
  id: string;
  email: string;
  preferred_username?: string;
  full_name?: string;
  email_verified: boolean | string;
  group_memberships: GroupMembership[];
  pending_invitations_count: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata: Record<string, any>;
  membership?: GroupMembership;
  member_count?: number;
  pending_invitations?: number;
  role_distribution?: Record<string, number>;
}

export interface GroupMembership {
  group_id: string;
  user_id: string;
  user_email: string;
  role: 'member' | 'manager' | 'administrator';
  joined_at: string;
  updated_at: string;
  added_by: string;
  metadata: Record<string, any>;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  email: string;
  role: 'member' | 'manager' | 'administrator';
  token: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string;
  accepted_at?: string;
  accepted_by?: string;
  metadata: Record<string, any>;
  group?: Group;
}

export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  message: string;
  token: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_comment: string;
  metadata: Record<string, any>;
  group?: Group;
}

// Auth API
export const authAPI = {
  getCurrentUser: () => auth.get<User>('/session'),
  login: (referrer?: string) => {
    const uiBasePath = import.meta.env.VITE_UI_BASE_PATH || '/deriva/apps';
    const defaultReferrer = `${window.location.origin}${uiBasePath}/`;
    const redirect = referrer || defaultReferrer;
    window.location.href = `${AUTH_API_BASE_URL}/login?referrer=${encodeURIComponent(redirect)}`;
  },
  logout: async (redirectUrl?: string) => {
    const uiBasePath = import.meta.env.VITE_UI_BASE_PATH || '/deriva/apps';
    const defaultRedirect = `${window.location.origin}${uiBasePath}/`;
    const redirect = redirectUrl || defaultRedirect;
    
    try {
      // Call logout endpoint with GET method - non-legacy mode will return 303 redirect, legacy mode returns JSON
      const response = await auth.get('/logout', {
        params: { redirect: redirect }
      });
      
      // If we get here, it's legacy mode with JSON response
      if (response.data && response.data.logout_url) {
        window.location.href = response.data.logout_url;
      }
    } catch (error) {
      // This shouldn't happen in normal operation, but just in case
      console.error('Logout error:', error);
    }
  },
};

// Groups API
export const groupsAPI = {
  // Groups
  listGroups: (myGroupsOnly = false) =>
    api.get<{ groups: Group[] }>(`/groups${myGroupsOnly ? '/my' : ''}`),

  createGroup: (data: { name: string; description?: string; visibility?: string; metadata?: Record<string, any> }) =>
    api.post<Group>('/groups', data),

  getGroup: (groupId: string) =>
    api.get<Group>(`/groups/${groupId}`),

  updateGroup: (groupId: string, data: { name?: string; description?: string; visibility?: string; metadata?: Record<string, any> }) =>
    api.put<Group>(`/groups/${groupId}`, data),

  deleteGroup: (groupId: string) =>
    api.delete(`/groups/${groupId}`),

  // Members
  getGroupMembers: (groupId: string) =>
    api.get<{ members: GroupMembership[] }>(`/groups/${groupId}/members`),

  addGroupMember: (groupId: string, data: { user_id: string; email: string; role: string }) =>
    api.post<GroupMembership>(`/groups/${groupId}/members`, data),

  removeGroupMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members`, {
      data: { user_id: userId }
    }),

  updateMemberRole: (groupId: string, userId: string, role: string) =>
    api.put(`/groups/${groupId}/members`, {
      user_id: userId,
      role
    }),

  // Invitations
  getGroupInvitations: (groupId: string) =>
    api.get<{ invitations: GroupInvitation[] }>(`/groups/${groupId}/invitations`),

  createInvitation: (groupId: string, data: { email: string; role: string }) =>
    api.post<GroupInvitation>(`/groups/${groupId}/invitations`, data),

  revokeInvitation: (groupId: string, invitationId: string) =>
    api.delete(`/groups/${groupId}/invitations/${invitationId}`),

  getPendingInvitations: () =>
    api.get<{ invitations: GroupInvitation[] }>('/invitations/pending'),

  acceptInvitation: (token: string) =>
    api.post<GroupMembership>(`/invitations/${token}/accept`),

  getInvitationInfo: (token: string) =>
    api.get<{ group_name: string; group_description: string; role: string; expires_at: string; is_valid: boolean }>(`/invitations/${token}`),

  // Public group info (no authentication required)
  getPublicGroupInfo: (groupId: string) =>
    api.get<{ id: string; name: string; description: string; visibility: string; created_at: string; member_count: number }>(`/groups/${groupId}/public`),
};

// Join Requests API
export const joinRequestsAPI = {
  // Group join requests (for admins/managers)
  getGroupJoinRequests: (groupId: string, pendingOnly = true) =>
    api.get<{ join_requests: JoinRequest[] }>(`/groups/${groupId}/join-requests${pendingOnly ? '?pending_only=true' : ''}`),

  approveJoinRequest: (groupId: string, requestId: string, data: { role?: string; comment?: string }) =>
    api.post<JoinRequest>(`/groups/${groupId}/join-requests/${requestId}/approve`, data),

  denyJoinRequest: (groupId: string, requestId: string, data: { comment?: string }) =>
    api.post<JoinRequest>(`/groups/${groupId}/join-requests/${requestId}/deny`, data),

  // User join requests
  getMyJoinRequests: () =>
    api.get<{ join_requests: JoinRequest[] }>('/join-requests/my'),

  cancelJoinRequest: (requestId: string) =>
    api.post(`/join-requests/${requestId}/cancel`),

  createJoinRequest: (groupId: string, data: { message?: string }) =>
    api.post<JoinRequest>(`/groups/${groupId}/request-to-join`, data),

  // Public join request endpoints
  getJoinInfo: (token: string) =>
    api.get<{ group_name: string; group_description: string; is_valid: boolean; expires_at: string }>(`/join/${token}`),

  requestToJoinViaToken: (token: string, data: { message?: string }) =>
    api.post<JoinRequest>(`/join/${token}`, data),
};

export default api;