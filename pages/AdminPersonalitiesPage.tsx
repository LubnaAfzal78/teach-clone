import React, { useEffect, useState } from 'react';
import { getAllPersonalities, updatePersonalityStatus, togglePersonalityActive } from '../services/adminService';
import { AIPersonality, PersonalityStatus } from '../types';
import AdminSidebar from '../components/AdminSidebar';
import PersonalityTestModal from '../components/PersonalityTestModal';
import Button from '../components/Button';
import { Bot, Check, X, Beaker, FileText, Filter, Eye, EyeOff } from 'lucide-react';

const AdminPersonalitiesPage: React.FC = () => {
  const [personalities, setPersonalities] = useState<(AIPersonality & { teacherName: string })[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchPersonalities = () => {
    setPersonalities(getAllPersonalities());
  };

  useEffect(() => {
    fetchPersonalities();
  }, []);

  const handleTest = (p: AIPersonality) => {
    console.log("Opening test modal for:", p);
    setSelectedPersonality(p);
    setIsTestModalOpen(true);
  };

  const handleAction = async (id: number, status: PersonalityStatus) => {
    let feedback = undefined;
    
    if (status === PersonalityStatus.REJECTED) {
      const result = prompt("Please provide a reason for rejection:");
      // If user clicks Cancel, result is null. If they click OK with empty text, result is "".
      if (result === null) {
        return; // User cancelled
      }
      feedback = result.trim() || "No specific reason provided.";
    }

    // Direct update without secondary confirmation for smoother UX, 
    // unless it is a rejection (prompt already acts as barrier) or we want to be very safe.
    // The user issue was "buttons not working", often due to getting stuck in prompt logic or ID mismatch.
    // Since we fixed prompt logic above and IDs in service, we can proceed.
    
    console.log(`Processing action ${status} for ID ${id}`);
    const success = await updatePersonalityStatus(id, status, feedback);
    if (success) {
      fetchPersonalities();
    } else {
      alert("Failed to update status. Please check console for errors.");
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    await togglePersonalityActive(id, !currentStatus);
    fetchPersonalities();
  };

  const filteredPersonalities = personalities.filter(p => {
    if (filter === 'all') return true;
    return p.approvalStatus === filter;
  });

  return (
    <AdminSidebar>
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Review AI Personalities</h1>
          <p className="text-gray-500 mt-1">Test and approve generated teacher clones.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-gray-400" />
           <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
           >
             <option value="all">All Status</option>
             <option value={PersonalityStatus.PENDING}>Pending Review</option>
             <option value={PersonalityStatus.APPROVED}>Approved</option>
             <option value={PersonalityStatus.REJECTED}>Rejected</option>
           </select>
        </div>
      </header>

      {filteredPersonalities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Bot className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No personalities found</h3>
          <p className="text-gray-500">There are no personalities matching the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPersonalities.map((p) => (
            <div key={p.personalityId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    {p.personalityName}
                  </h2>
                  <p className="text-gray-500 mt-1">Teacher: <span className="font-medium text-gray-700">{p.teacherName}</span></p>
                </div>
                <div>
                    {p.approvalStatus === PersonalityStatus.PENDING && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Pending Review
                        </span>
                    )}
                    {p.approvalStatus === PersonalityStatus.APPROVED && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Approved
                        </span>
                    )}
                    {p.approvalStatus === PersonalityStatus.REJECTED && (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Rejected
                        </span>
                    )}
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4" /> System Prompt Preview
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg text-sm font-mono text-gray-600 whitespace-pre-wrap">
                  {expandedPromptId === p.personalityId 
                    ? p.systemPrompt 
                    : `${p.systemPrompt.substring(0, 300)}...`
                  }
                </div>
                <button 
                  onClick={() => setExpandedPromptId(expandedPromptId === p.personalityId ? null : p.personalityId)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  {expandedPromptId === p.personalityId ? 'Show Less' : 'View Full Prompt'}
                </button>
              </div>

              <div className="p-6 flex flex-wrap gap-4 justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                    <Button 
                    variant="secondary" 
                    className="w-auto"
                    onClick={() => handleTest(p)}
                    >
                    <Beaker className="w-4 h-4" /> Test Personality
                    </Button>

                    {/* Toggle Switch for Approved Personalities */}
                    {p.approvalStatus === PersonalityStatus.APPROVED && (
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                            <span className={`text-sm font-medium flex items-center gap-2 ${p.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                {p.isActive ? 'Visible to Students' : 'Hidden from Students'}
                            </span>
                            <button
                                onClick={() => handleToggleActive(p.personalityId, p.isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                                p.isActive ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                                title={p.isActive ? "Disable visibility" : "Enable visibility"}
                            >
                                <span
                                className={`${
                                    p.isActive ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                                />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                  {p.approvalStatus === PersonalityStatus.PENDING && (
                      <>
                        <button 
                            onClick={() => handleAction(p.personalityId, PersonalityStatus.REJECTED)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                        >
                            <X className="w-4 h-4" /> Reject
                        </button>
                        <button 
                            onClick={() => handleAction(p.personalityId, PersonalityStatus.APPROVED)}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium shadow-sm transition-colors"
                        >
                            <Check className="w-4 h-4" /> Approve
                        </button>
                      </>
                  )}
                  {p.approvalStatus === PersonalityStatus.REJECTED && (
                      <button 
                        onClick={() => handleAction(p.personalityId, PersonalityStatus.APPROVED)}
                        className="text-sm text-gray-500 hover:text-green-600 underline"
                      >
                        Re-evaluate & Approve
                      </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Modal */}
      <PersonalityTestModal 
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        personality={selectedPersonality}
        teacherName={selectedPersonality && 'teacherName' in selectedPersonality ? (selectedPersonality as any).teacherName : ''}
      />
    </AdminSidebar>
  );
};

export default AdminPersonalitiesPage;