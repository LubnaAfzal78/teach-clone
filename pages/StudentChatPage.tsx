import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { startConversation, getConversationMessages, processStudentMessage, getPersonalityById } from '../services/chatService';
import { Message, AIPersonality } from '../types';
import { ArrowLeft, Send, Bot, MoreVertical, Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';

// Web Speech API types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const StudentChatPage: React.FC = () => {
  const { personalityId } = useParams<{ personalityId: string }>();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [personality, setPersonality] = useState<AIPersonality | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Voice Input State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Audio Playback State
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Chat
  useEffect(() => {
    if (!user || !personalityId) return;

    const pId = parseInt(personalityId);
    const p = getPersonalityById(pId);
    
    if (!p) {
      showNotification('error', "Teacher personality not found.");
      navigate('/dashboard');
      return;
    }
    
    setPersonality(p);

    // Get or Create Conversation
    const convo = startConversation(user.userId, pId);
    setConversationId(convo.conversationId);
    
    // Load Messages
    setMessages(getConversationMessages(convo.conversationId));
    setLoading(false);

  }, [user, personalityId, navigate, showNotification]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isRecording]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after one sentence/pause
      recognitionRef.current.interimResults = true; // Show results as you speak
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInputText(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            showNotification('error', 'Microphone access denied. Please check your browser permissions.');
        } else if (event.error === 'no-speech') {
            // Ignore no-speech errors (often happens if silence)
        } else {
            showNotification('error', `Voice error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [showNotification]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    // 1. Stop HTML5 Audio (Google TTS results)
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = ""; // Detach source to ensure full stop
    }
    
    // 2. Stop Browser Synthesis (Fallback)
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    setPlayingMessageId(null);
  };

  const toggleRecording = () => {
    // AGGRESSIVE STOP: Stop speaking if user wants to talk!
    stopAudio(); 

    if (!recognitionRef.current) {
      showNotification('error', 'Voice input is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start recording:", e);
        setIsRecording(false);
      }
    }
  };

  const playMessageAudio = (msg: Message) => {
    // If currently playing this message, stop it
    if (playingMessageId === msg.messageId) {
      stopAudio();
      return;
    }

    // Stop any other audio before starting new one
    stopAudio();

    // Check if we have pre-generated audio from Google TTS (unlikely given new logic, but good for backward compat)
    if (msg.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${msg.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.playbackRate = playbackSpeed;
        
        audio.onended = () => setPlayingMessageId(null);
        audio.onerror = (e) => {
            console.error("Audio playback error", e);
            showNotification('error', 'Could not play audio.');
            setPlayingMessageId(null);
        };

        audioRef.current = audio;
        setPlayingMessageId(msg.messageId);
        audio.play().catch(e => {
            console.error("Play failed", e);
            setPlayingMessageId(null);
        });
        return;
    }

    // Browser Native TTS
    if (!msg.messageText) return;

    // Use browser native synthesis
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(msg.messageText);
    utterance.rate = playbackSpeed;
    
    // Attempt to configure voice
    if (msg.audioConfig) {
        // Adjust pitch. API uses -2.0 to 2.0 (approx semitones in our mock logic). Browser uses 0.5 to 2.0.
        // Base is 1.0. 
        if (msg.audioConfig.pitch) {
            const pitchMod = msg.audioConfig.pitch > 0 ? 0.1 : -0.1;
            utterance.pitch = Math.min(Math.max(1.0 + pitchMod, 0.8), 1.2); // Clamp for natural sound
        }
    }
    
    utterance.lang = 'en-US'; 

    // Intelligent Voice Selection
    const voices = synth.getVoices();
    let selectedVoice = null;
    const preferredGender = msg.audioConfig?.gender || 'Male';

    if (preferredGender === 'Female') {
        selectedVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
    } else {
        selectedVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google US English'));
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = (e) => {
        console.error("Browser TTS error", e);
        setPlayingMessageId(null);
    };

    setPlayingMessageId(msg.messageId);
    synth.speak(utterance);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
      e.stopPropagation();
      const speeds = [0.75, 1.0, 1.25, 1.5];
      const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
      const newSpeed = speeds[nextIdx];
      setPlaybackSpeed(newSpeed);
      
      if (playingMessageId && audioRef.current) {
          audioRef.current.playbackRate = newSpeed;
      }
      // Note: Changing speed for in-progress browser TTS is tricky/inconsistent across browsers,
      // usually requires cancelling and restarting. We'll apply it to the next utterance.
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    stopAudio(); // Stop any audio immediately
    
    if (!inputText.trim() || !conversationId || !personalityId || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Optimistic Update
    const tempMsg: Message = {
        messageId: Date.now(),
        conversationId: conversationId,
        senderType: 'student',
        messageText: text,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    // Call API
    const response = await processStudentMessage(conversationId, parseInt(personalityId), text);

    if (response.success && response.aiResponse) {
        const aiMsg: Message = {
            messageId: Date.now() + 1,
            conversationId: conversationId,
            senderType: 'ai',
            messageText: response.aiResponse,
            createdAt: response.timestamp || new Date().toISOString(),
            audioConfig: response.audioConfig,
            audioBase64: response.audioBase64
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // Auto-play response
        setTimeout(() => playMessageAudio(aiMsg), 200); 
    } else {
        showNotification('error', "Failed to send message: " + response.message);
    }

    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Interaction Handlers to Stop Audio
  const handleInputFocus = () => {
    if (playingMessageId !== null) stopAudio();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (playingMessageId !== null) stopAudio();
    setInputText(e.target.value);
  };

  if (loading || !personality) {
     return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#e5ddd5] relative">
      {/* 1. Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => { stopAudio(); navigate('/dashboard'); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-sm">
             <Bot className="w-6 h-6" />
          </div>
          
          <div>
            <h1 className="font-bold text-gray-800 leading-tight text-sm md:text-base">{personality.personalityName}</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-xs text-green-600 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-100">
        {messages.length === 0 && (
          <div className="flex justify-center mt-8">
             <div className="bg-yellow-50 text-gray-800 text-sm p-3 rounded-lg shadow border border-yellow-100 max-w-xs text-center">
               Say hello to your new AI teacher! Ask any question or tap the microphone to speak.
             </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isStudent = msg.senderType === 'student';
          const isPlaying = playingMessageId === msg.messageId;

          return (
            <div key={idx} className={`flex w-full ${isStudent ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col max-w-[85%] sm:max-w-[70%]`}>
                
                {/* Message Bubble */}
                <div 
                    className={`
                    rounded-lg px-3 py-2 shadow-sm text-sm relative leading-relaxed
                    ${isStudent 
                        ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' 
                        : 'bg-white text-gray-900 rounded-tl-none'
                    }
                    `}
                >
                    <div className="whitespace-pre-wrap">{msg.messageText}</div>
                    
                    <div className="text-[10px] text-gray-500 text-right mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Audio Player for AI Messages */}
                {!isStudent && (
                    <div className="mt-1 flex items-center gap-2">
                        <div className="bg-white rounded-full p-1 shadow-sm border border-gray-100 flex items-center gap-2 pr-3">
                            <button 
                                onClick={() => playMessageAudio(msg)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            
                            {isPlaying ? (
                                <div className="flex gap-1 h-3 items-end">
                                    <span className="w-1 bg-green-500 animate-[bounce_1s_infinite] h-2"></span>
                                    <span className="w-1 bg-green-500 animate-[bounce_1s_infinite_0.2s] h-3"></span>
                                    <span className="w-1 bg-green-500 animate-[bounce_1s_infinite_0.4s] h-1"></span>
                                </div>
                            ) : (
                                <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                    <Volume2 className="w-3 h-3" /> Listen
                                </div>
                            )}

                            {/* Speed Control */}
                            <button 
                                onClick={cycleSpeed}
                                className="ml-2 text-[10px] font-bold text-gray-400 hover:text-blue-500 border border-gray-200 rounded px-1 min-w-[32px] transition-colors"
                                title="Change playback speed"
                            >
                                {playbackSpeed}x
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing / Processing Indicator */}
        {isSending && (
           <div className="flex justify-start w-full">
             <div className="bg-white rounded-lg px-4 py-3 shadow-sm rounded-tl-none flex gap-1 items-center">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Area */}
      <footer className="bg-white px-3 py-2 md:px-4 md:py-3 z-10 shadow-lg border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
          
          {/* Voice Input Button */}
          <button 
            type="button"
            onClick={toggleRecording}
            className={`
              p-3 rounded-full flex-shrink-0 transition-all shadow-md relative
              ${isRecording 
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            title="Voice Input"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isRecording && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
          </button>

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-green-500 focus-within:bg-white transition-colors">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening..." : "Type your question in English..."}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 text-gray-800 placeholder-gray-500 text-sm py-1"
              rows={1}
              style={{ minHeight: '24px' }}
            />
          </div>
          
          <button 
            type="submit"
            disabled={(!inputText.trim() && !isRecording) || isSending}
            className={`
              p-3 rounded-full flex-shrink-0 transition-all shadow-md
              ${(!inputText.trim() && !isRecording) || isSending 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-[#4A90E2] text-white hover:bg-blue-600 active:scale-95'
              }
            `}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default StudentChatPage;