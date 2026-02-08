import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getTeachers, updateTeacherStatus } from '../services/adminService';
import { User, UserStatus } from '../types';
import AdminSidebar from '../components/AdminSidebar';

const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const location = useLocation();

  const fetchTeachers = () => {
    const data = getTeachers();
    setTeachers([...data]); 
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleStatusChange = async (userId: number, action: 'approve' | 'reject') => {
    // Removed window.confirm to ensure buttons work instantly like the PHP version
    console.log(`[AdminTeachers] Processing ${action} for user ${userId}`);

    const newStatus = action === 'approve' ? UserStatus.APPROVED : UserStatus.REJECTED;
    
    try {
      const success = await updateTeacherStatus(userId, newStatus);

      if (success) {
        if (action === 'approve') {
          setMessage({ text: '✅ Teacher approved successfully!', type: 'success' });
        } else {
          setMessage({ text: '✅ Teacher rejected', type: 'error' });
        }
        
        // Refresh list immediately
        fetchTeachers();
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        console.error("Update failed in service");
        setMessage({ text: '❌ Database Error: User not found', type: 'error' });
      }
    } catch (e) {
      console.error("Handle Status Change Error:", e);
      setMessage({ text: '❌ Unexpected Error', type: 'error' });
    }
  };

  return (
    <AdminSidebar>
      <div className="main-content">
          <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '2em', fontWeight: 'bold' }}>Teachers</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Manage teacher accounts and approvals.</p>
          
          {message && (
            <div style={{
              background: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              borderLeft: `4px solid ${message.type === 'success' ? '#28a745' : '#dc3545'}`
            }}>
              {message.text}
            </div>
          )}
          
          <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                          <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#666' }}>TEACHER NAME</th>
                          <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#666' }}>EMAIL</th>
                          <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#666' }}>STATUS</th>
                          <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6', color: '#666' }}>ACTIONS</th>
                      </tr>
                  </thead>
                  <tbody>
                      {teachers.map(teacher => {
                        let badgeStyle = { padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
                        let specificStyle = {};
                        if (teacher.status === UserStatus.PENDING) specificStyle = { background: '#fff3cd', color: '#856404' };
                        else if (teacher.status === UserStatus.APPROVED) specificStyle = { background: '#d4edda', color: '#155724' };
                        else if (teacher.status === UserStatus.REJECTED) specificStyle = { background: '#f8d7da', color: '#721c24' };

                        return (
                          <tr key={teacher.userId} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '15px' }}>
                                  <strong>{teacher.fullName}</strong><br/>
                                  <small style={{ color: '#999' }}>ID: #{teacher.userId}</small>
                              </td>
                              <td style={{ padding: '15px', color: '#333' }}>
                                  {teacher.email}
                              </td>
                              <td style={{ padding: '15px' }}>
                                  <span style={{ ...badgeStyle, ...specificStyle }}>
                                      {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                                  </span>
                              </td>
                              <td style={{ padding: '15px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleStatusChange(teacher.userId, 'approve');
                                        }}
                                        style={{
                                          background: '#28a745',
                                          color: 'white',
                                          border: 'none',
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '18px',
                                          fontWeight: 'bold',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        title="Approve"
                                      >
                                        ✓
                                      </button>
                                      
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleStatusChange(teacher.userId, 'reject');
                                        }}
                                        style={{
                                          background: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '18px',
                                          fontWeight: 'bold',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        title="Reject"
                                      >
                                        ✕
                                      </button>
                                  </div>
                              </td>
                          </tr>
                        );
                      })}

                      {teachers.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No teachers found</td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
          
          <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
              <strong>Debug Info:</strong><br/>
              Current Path: {location.pathname}<br/>
              Total Teachers Loaded: {teachers.length}
          </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminTeachersPage;