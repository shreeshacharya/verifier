
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Loader2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Database,
  Camera,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Layers,
  School,
  FileX
} from 'lucide-react';
import { analyzeCertificate } from '../services/geminiService';

const Verifier = ({ db }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Helper to normalize IDs for robust comparison (removes all non-alphanumeric)
  const normalizeId = (id) => {
    if (!id) return '';
    return id.replace(/[^a-z0-9]/gi, '').toLowerCase().trim();
  };

  const startCamera = async () => {
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access to use this feature.");
      setStep('upload');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setPreview(dataUrl);
      
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      
      setStep('upload');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setStep('upload');
      };
      reader.readAsDataURL(selected);
    }
  };

  const verify = async () => {
    if (!preview) return;
    setLoading(true);
    setStep('analyzing');
    
    try {
      const base64 = preview.split(',')[1];
      const aiResponse = await analyzeCertificate(base64);
      
      const detectedIdNorm = normalizeId(aiResponse.certificateId);
      const detectedNameNorm = normalizeId(aiResponse.studentName);

      // 1. Check if AI identified this as an academic document
      if (!aiResponse.isAcademicCertificate) {
        setResult({
          isGenuine: false,
          confidenceScore: 0,
          detectedData: aiResponse,
          tamperingDetected: false,
          analysisNotes: "This document does not appear to be an academic certificate or result sheet. It was identified as an unrelated document (e.g., ID card, personal document)."
        });
        setStep('result');
        return;
      }

      // 2. Strict Database Matching Logic
      // We prioritize the Certificate ID (USN/Register Number) as the primary key.
      const matched = db.find(r => {
        const dbIdNorm = normalizeId(r.certificateId);
        const dbNameNorm = normalizeId(r.studentName);
        
        // Primary match: normalized ID must match exactly
        const idMatch = dbIdNorm === detectedIdNorm && detectedIdNorm.length > 0;
        
        // Secondary verification: if ID matches, does the name also reasonably match?
        // This prevents matching a correct ID with a completely different name (tampering)
        const nameMatch = dbNameNorm.includes(detectedNameNorm) || detectedNameNorm.includes(dbNameNorm);
        
        return idMatch && nameMatch;
      });

      // 3. Final Verification Status
      // A record is genuine ONLY if it exists in the DB AND no significant tampering is detected by AI
      const isGenuine = !!matched && (!aiResponse.tamperingDetected || aiResponse.tamperingScore < 30);
      
      setResult({
        isGenuine,
        confidenceScore: isGenuine ? 100 : (matched ? 45 : 0),
        detectedData: aiResponse,
        matchedRecord: matched,
        tamperingDetected: aiResponse.tamperingDetected && aiResponse.tamperingScore >= 30,
        analysisNotes: aiResponse.forensicNotes || (matched ? "Record found in registry." : "No matching record found in university database.")
      });
      
      setStep('result');
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please ensure the Register Number (USN) is clear.");
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setStep('upload');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">VeriCert AI</h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto italic">
          High-accuracy USN & Student Name matching for university results.
        </p>
        <div className="mt-6 inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
           <Database size={14} className="text-blue-600" />
           <span className="text-xs font-black text-blue-700 uppercase tracking-widest">{db.length} Verified Records in Registry</span>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {step === 'upload' && (
          <div className="p-8 md:p-12 space-y-8">
            {!preview ? (
              <div className="grid md:grid-cols-2 gap-6">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-blue-500 hover:bg-blue-50/50 transition-all overflow-hidden"
                >
                  <div className="p-5 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-bold text-slate-800">Upload Result Image</p>
                    <p className="text-xs text-slate-500 mt-1">Files with USN & Student Name</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </button>

                <button 
                  onClick={startCamera}
                  className="group relative h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-purple-500 hover:bg-purple-50/50 transition-all overflow-hidden"
                >
                  <div className="p-5 bg-purple-100 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
                    <Camera size={32} />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-bold text-slate-800">Live Camera Scan</p>
                    <p className="text-xs text-slate-500 mt-1">Quick capture for physical sheets</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="relative aspect-[1.4/1] bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-200">
                  <img src={preview} alt="Scan Preview" className="w-full h-full object-contain" />
                  <button onClick={reset} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black text-white rounded-full backdrop-blur-sm transition-all">
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="mt-8">
                  <button 
                    onClick={verify}
                    className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-xl"
                  >
                    <ShieldCheck size={24} />
                    <span>AUTHENTICATE RECORD</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'camera' && (
          <div className="relative h-[600px] bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 border-[40px] border-black/40 flex items-center justify-center">
              <div className="w-full max-w-[90%] aspect-[1.414/1] border-2 border-dashed border-white/50 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                 <div className="absolute top-0 left-0 right-0 p-4 text-center">
                    <span className="bg-black/50 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Position USN & Name inside frame</span>
                 </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center space-x-8">
              <button onClick={() => setStep('upload')} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"><ArrowLeft size={24} /></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-white/30 hover:scale-105 transition-transform shadow-2xl"></button>
              <div className="w-12 h-12"></div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="p-20 flex flex-col items-center text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 border-8 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 italic">Searching University Registry...</h2>
              <p className="text-slate-500 font-medium italic">Matching USN biometric and student credentials</p>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <div className={`p-10 text-center space-y-4 border-b ${
              result.isGenuine ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
            }`}>
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-lg ${
                result.isGenuine ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {result.isGenuine ? <CheckCircle2 size={48} /> : <AlertTriangle size={48} />}
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase">
                  {result.isGenuine ? 'Verified Authentic' : 'Verification Alert'}
                </h2>
                <p className={`text-lg font-bold ${result.isGenuine ? 'text-green-700' : 'text-red-700'}`}>
                  Registry Match Score: {result.confidenceScore}%
                </p>
              </div>
            </div>

            <div className="p-12 space-y-12">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Extracted from Scan</h3>
                  <div className="space-y-4">
                    <ResultItem label="Student Name" value={result.detectedData.studentName} />
                    <ResultItem label="Register No (USN)" value={result.detectedData.certificateId} mono />
                    <ResultItem label="Institution" value={result.detectedData.institution} />
                    <ResultItem label="Year" value={result.detectedData.graduationYear} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Database Record</h3>
                  <div className="bg-slate-50 p-6 rounded-[32px] space-y-6">
                    {result.matchedRecord ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-500">Official Status</span>
                          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-green-100 text-green-700">VERIFIED MATCH</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semester</div>
                              <div className="text-base font-black text-slate-900">{result.matchedRecord.semester || 'N/A'}</div>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Result</div>
                              <div className="text-base font-black text-slate-900">{result.matchedRecord.resultStatus || 'PASS'}</div>
                           </div>
                        </div>
                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center">
                           <School size={20} className="text-blue-400 mr-4" />
                           <div>
                              <div className="text-[10px] font-bold text-blue-400 uppercase">Registered College</div>
                              <div className="text-sm font-black text-blue-900">{result.matchedRecord.institution}</div>
                           </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-10 text-center space-y-3">
                         <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                            <FileX size={32} />
                         </div>
                         <div className="text-sm font-black text-red-700 uppercase tracking-widest">NO MATCHING USN</div>
                         <p className="text-xs text-slate-500 max-w-[220px] font-medium leading-relaxed">
                            The Register Number "<strong>{result.detectedData.certificateId}</strong>" was not found in the verified university database of {db.length} records.
                         </p>
                         <div className="pt-2">
                           <p className="text-[10px] text-slate-400 font-bold uppercase italic underline cursor-pointer" onClick={() => window.location.hash = '#/admin'}>Go to Admin Panel to populate registry</p>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-center border-t border-slate-100">
                <button 
                  onClick={reset}
                  className="px-12 py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                  Scan Next Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResultItem = ({ label, value, mono }) => (
  <div className="flex justify-between border-b border-slate-100 pb-3 items-baseline">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black text-slate-900 ${mono ? 'font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200' : ''}`}>
      {value || 'Not Extracted'}
    </span>
  </div>
);

export default Verifier;
