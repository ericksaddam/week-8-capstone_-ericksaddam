import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, ClubCreationRequest, ClubJoinRequest } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminRequestManagement: React.FC = () => {
  const [creationRequests, setCreationRequests] = useState<ClubCreationRequest[]>([]);
  const [joinRequests, setJoinRequests] = useState<ClubJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [creationRes, joinRes] = await Promise.all([
        adminApi.getClubCreationRequests(),
        adminApi.getJoinRequests(),
      ]);
      setCreationRequests(creationRes);
      setJoinRequests(joinRes);
      setError(null);
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      toast.error('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApproveCreation = async (requestId: string) => {
    try {
      await adminApi.approveClubCreationRequest(requestId);
      toast.success('Club creation request approved.');
      setCreationRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request.');
    }
  };

  const handleRejectCreation = async (requestId: string) => {
    try {
      await adminApi.rejectClubCreationRequest(requestId);
      toast.success('Club creation request rejected.');
      setCreationRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject request.');
    }
  };

  const handleApproveJoin = async (clubId: string, requestId: string) => {
    try {
      await adminApi.approveJoinRequest(clubId, requestId);
      toast.success('Join request approved.');
      setJoinRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request.');
    }
  };

  const handleRejectJoin = async (clubId: string, requestId: string) => {
    try {
      await adminApi.rejectJoinRequest(clubId, requestId);
      toast.success('Join request rejected.');
      setJoinRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject request.');
    }
  };

  if (loading) return <div className="text-center p-4">Loading requests...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Club Creation Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Club Creation Requests</CardTitle>
          <CardDescription>Review and approve or reject new club proposals.</CardDescription>
        </CardHeader>
        <CardContent>
          {creationRequests.length === 0 ? (
            <p className="text-muted-foreground">No pending club creation requests.</p>
          ) : (
            <div className="space-y-4">
              {creationRequests.map(req => (
                <div key={req._id} className="p-4 border rounded-lg flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{req.name}</h4>
                    <p className="text-sm text-muted-foreground">Requested by: {req.createdBy.name}</p>
                    <p className="text-sm mt-2"><strong>Description:</strong> {req.description}</p>
                    <p className="text-sm mt-1"><strong>Purpose:</strong> {req.purpose}</p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleRejectCreation(req._id)}>Reject</Button>
                    <Button size="sm" onClick={() => handleApproveCreation(req._id)}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Club Join Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Club Join Requests</CardTitle>
          <CardDescription>Review and approve or reject requests from users to join clubs.</CardDescription>
        </CardHeader>
        <CardContent>
          {joinRequests.length === 0 ? (
            <p className="text-muted-foreground">No pending join requests.</p>
          ) : (
            <div className="space-y-4">
              {joinRequests.map(req => (
                <div key={req._id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <p>
                      <span className="font-bold">{req.user.name}</span> ({req.user.email}) wants to join{' '}
                      <span className="font-bold">{req.club.name}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested on: {format(new Date(req.requestedAt), 'PPP')}
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleRejectJoin(req.club._id, req._id)}>Reject</Button>
                    <Button size="sm" onClick={() => handleApproveJoin(req.club._id, req._id)}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRequestManagement;
