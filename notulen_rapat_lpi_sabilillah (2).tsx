import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Calendar, Clock, MapPin, User, AlertCircle, Save, Check, X,
  Upload, File as FileIcon, Download, RefreshCw, Printer, ChevronRight, Activity
} from 'lucide-react';

// ==============================================================================
// MASUKKAN URL GOOGLE APPS SCRIPT ANDA DI SINI:
const GAS_URL = "https://script.google.com/macros/s/AKfycbw9XLpxpz62IcRKvzj8UgRib7mfq_ZQ3HO0slaYZKTgCXmqJpFSVEWX5MExrfj_nfZ55w/exec"; 
// ==============================================================================

// URL Ikon 3D dari GitHub (Microsoft Fluent UI Emoji)
const icons3D = {
  logo: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clipboard/3D/clipboard_3d.png",
  profil: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Spiral%20calendar/3D/spiral_calendar_3d.png",
  topik: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Speech%20balloon/3D/speech_balloon_3d.png",
  aksi: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png",
  catatan: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Notebook/3D/notebook_3d.png",
  riwayat: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Card%20file%20box/3D/card_file_box_3d.png",
  lampiran: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Paperclip/3D/paperclip_3d.png"
};

const App = () => {
  // State for Profile
  const [profile, setProfile] = useState({
    nomor: '', sifat: 'Rutin', agenda: '', tanggal: '', waktu: '', tempat: '', pimpinan: '', notulis: '', jumlahHadir: '', totalPeserta: ''
  });

  // State for Topics & Actions
  const [topics, setTopics] = useState([{ id: 1, nama: '', masalah: '', masukan: '' }]);
  const [actions, setActions] = useState([{ id: 1, topikId: '', solusi: '', pj: '', tenggatWaktu: '' }]);
  
  // State for File & Notes
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [catatan, setCatatan] = useState('');

  // State for UI mode
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // States for GAS Database
  const [savedList, setSavedList] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [connectionError, setConnectionError] = useState(''); 

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('html2pdf-script')) {
      const script = document.createElement('script');
      script.id = 'html2pdf-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
    fetchNotulenList();
  }, []);

  const fetchNotulenList = async () => {
    if (!GAS_URL || GAS_URL.includes("YOUR_URL_HERE")) {
      setConnectionError("URL Google Apps Script belum diisi pada baris ke-6.");
      return;
    }

    setConnectionError('');
    setIsLoadingList(true);
    try {
      const response = await fetch(GAS_URL);
      const textResponse = await response.text(); 
      
      try {
        const result = JSON.parse(textResponse); 
        if (result.status === "success") {
          setSavedList(result.data || []);
        } else {
          setConnectionError("Gagal memuat: " + result.message);
        }
      } catch (parseError) {
        setConnectionError("Akses Ditolak. Pastikan Akses Deployment GAS di-set ke 'Siapa saja' (Anyone).");
      }
    } catch (error) {
      setConnectionError("Koneksi gagal. Pastikan URL benar & internet lancar.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSave = async () => {
    if (!GAS_URL || GAS_URL.includes("YOUR_URL_HERE")) {
      alert("Harap masukkan URL Google Apps Script Anda di baris ke-6 kode app.jsx");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: currentDocId,
        profile, topics, actions, attendanceFile, catatan
      };

      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      const textResponse = await response.text();
      try {
        const result = JSON.parse(textResponse);
        if (result.status === "success") {
          setCurrentDocId(result.id);
          
          if (attendanceFile && !attendanceFile.isDriveUrl && result.fileUrl) {
              setAttendanceFile({
                  ...attendanceFile,
                  data: result.fileUrl,
                  isDriveUrl: true
              });
          }

          setShowSaveToast(true);
          setTimeout(() => setShowSaveToast(false), 3000);
          fetchNotulenList(); 
        } else {
          alert("Gagal menyimpan: " + result.message);
        }
      } catch (e) {
        alert("Gagal menyimpan: Izin akses Apps Script belum diset 'Siapa Saja'.");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNotulen = async (id) => {
    try {
      setSavedList(prev => prev.filter(item => item.id !== id)); 
      const response = await fetch(`${GAS_URL}?action=delete&id=${id}`);
      const textResponse = await response.text();
      
      try {
        const result = JSON.parse(textResponse);
        if (result.status === "success") {
          if (currentDocId === id) handleBaru();
        } else {
          fetchNotulenList(); 
          alert("Gagal menghapus: " + result.message);
        }
      } catch (e) {
        alert("Gagal menghapus: Kendala akses Apps Script.");
        fetchNotulenList(); 
      }
    } catch (e) {
      fetchNotulenList(); 
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const loadNotulen = (item) => {
    setProfile(item.profile || { nomor: '', sifat: 'Rutin', agenda: '', tanggal: '', waktu: '', tempat: '', pimpinan: '', notulis: '', jumlahHadir: '', totalPeserta: '' });
    setTopics(item.topics || [{ id: 1, nama: '', masalah: '', masukan: '' }]);
    setActions(item.actions || [{ id: 1, topikId: '', solusi: '', pj: '', tenggatWaktu: '' }]);
    setAttendanceFile(item.attendanceFile || null);
    setFileError('');
    setCatatan(item.catatan || '');
    setCurrentDocId(item.id);
    setDeleteConfirmId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBaru = () => {
    setProfile({ nomor: '', sifat: 'Rutin', agenda: '', tanggal: '', waktu: '', tempat: '', pimpinan: '', notulis: '', jumlahHadir: '', totalPeserta: '' });
    setTopics([{ id: Date.now(), nama: '', masalah: '', masukan: '' }]);
    setActions([{ id: Date.now(), topikId: '', solusi: '', pj: '', tenggatWaktu: '' }]);
    setAttendanceFile(null);
    setFileError('');
    setCatatan('');
    setCurrentDocId(null);
    setDeleteConfirmId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const addItem = (setter, defaultItem) => setter(prev => [...prev, { ...defaultItem, id: Date.now() }]);
  const removeItem = (id, setter) => setter(prev => prev.filter(item => item.id !== id));
  const updateItem = (id, field, value, setter) => setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => { window.print(); setIsPrintMode(false); }, 500);
  };

  const handleDownloadPDF = () => {
    if (typeof window === 'undefined' || !window.html2pdf) {
      alert("Library PDF sedang dimuat, mohon coba lagi dalam beberapa detik.");
      return;
    }
    
    setIsPrintMode(true);
    setIsDownloading(true);
    
    setTimeout(() => {
      const element = document.getElementById('print-area');
      const safeAgendaName = profile.agenda ? profile.agenda.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_') : 'Rapat';
      const fileName = `Notulen_${safeAgendaName}.pdf`;
      
      const opt = {
        margin:       [20, 20, 20, 20], 
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowY: 0 }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };
      
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsPrintMode(false);
        setIsDownloading(false);
      }).catch(err => {
        setIsPrintMode(false);
        setIsDownloading(false);
      });
    }, 1000); 
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'image/jpeg', 'image/jpg', 'image/png'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
      setFileError("Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.");
      return;
    }

    if (file.size > 800 * 1024) {
      setFileError("Ukuran file maksimal 800KB.");
      return;
    }
    setFileError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttendanceFile({
        name: file.name,
        type: file.type || file.name.split('.').pop(),
        data: reader.result, 
        isDriveUrl: false 
      });
    };
    reader.readAsDataURL(file);
  };

  if (isPrintMode) {
    return (
      <div id="print-area" className={`bg-white text-black mx-auto ${isDownloading ? 'p-0' : 'p-8 max-w-4xl'}`}>
        <style>{`
          .break-before-page { page-break-before: always; break-before: page; }
          @media print {
            body { background: white !important; margin: 0; padding: 0; }
            @page { size: A4; margin: 2cm; }
          }
          .print-container { font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11pt; line-height: 1.1; color: black; width: 100%; text-align: justify; }
          .print-table { width: 100%; border-collapse: collapse; margin-bottom: 0.75rem; border: 1px solid black; page-break-inside: auto; }
          .print-table tr { page-break-inside: avoid; page-break-after: auto; }
          .print-table th, .print-table td { border: 1px solid black; padding: 3px 6px; vertical-align: top; }
          .print-table th { background-color: #f3f4f6; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}</style>
        
        <div className="print-container">
          <div className="mb-3 text-center font-bold text-lg uppercase underline">NOTULEN RAPAT</div>
          <div className="font-bold mb-1">I. Profil Rapat</div>
          <table className="print-table">
            <tbody>
              <tr><td className="font-bold w-1/4">Nomor Notulen</td><td className="w-1/4">{profile.nomor}</td><td className="font-bold w-1/4">Sifat Rapat</td><td className="w-1/4">{profile.sifat}</td></tr>
              <tr><td className="font-bold">Agenda / Topik</td><td colSpan="3">{profile.agenda}</td></tr>
              <tr>
                <td className="font-bold">Hari & Tanggal</td>
                <td>{profile.tanggal ? new Date(profile.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</td>
                <td className="font-bold">Waktu</td>
                <td>{profile.waktu ? `${profile.waktu.replace(':', '.')} - Selesai` : ''}</td>
              </tr>
              <tr><td className="font-bold">Tempat</td><td>{profile.tempat}</td><td className="font-bold">Pimpinan Rapat</td><td>{profile.pimpinan}</td></tr>
              <tr><td className="font-bold">Notulis</td><td>{profile.notulis}</td><td className="font-bold">Jumlah Hadir</td><td>{profile.jumlahHadir || '0'} dari {profile.totalPeserta || '0'} orang</td></tr>
            </tbody>
          </table>

          <div className="font-bold mb-1 mt-3">II. Isu & Topik Utama yang Dibahas</div>
          <div className="mb-3 pl-4 text-justify">
            {topics.map((t, idx) => (
              <div key={t.id} className="mb-2">
                <div className="font-bold">{idx + 1}. {t.nama || '[Topik Belum Diisi]'}</div>
                <div className="ml-4 mt-0.5 grid grid-cols-[130px_1fr] gap-x-2 gap-y-0.5">
                  <span className="italic">Deskripsi masalah:</span><span className="whitespace-pre-wrap">{t.masalah}</span>
                  <span className="italic">Pandangan/masukan:</span><span className="whitespace-pre-wrap">{t.masukan}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="font-bold mb-1 mt-3">III. Pemecahan, Keputusan, & Rencana Aksi</div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-8 text-center">No</th><th>Topik / Isu</th><th>Solusi & Keputusan Akhir</th><th className="w-28 text-center">PJ</th><th className="w-24 text-center">Tenggat Waktu</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a, idx) => {
                const topicName = topics.find(t => t.id.toString() === a.topikId)?.nama || '-';
                return (
                  <tr key={a.id}>
                    <td className="text-center">{idx + 1}</td><td>{topicName}</td><td className="whitespace-pre-wrap">{a.solusi}</td><td className="font-bold text-center">{a.pj}</td>
                    <td className="font-bold text-center">{a.tenggatWaktu ? new Date(a.tenggatWaktu).toLocaleDateString('id-ID') : ''}</td>
                  </tr>
                );
              })}
              {actions.length === 0 && <tr><td className="text-center" colSpan="5">Tidak ada rencana aksi</td></tr>}
            </tbody>
          </table>

          <div className="font-bold mb-1 mt-3">IV. Catatan Tambahan / Lain-lain</div>
          <div className="border border-black p-2 min-h-[60px] mb-4 whitespace-pre-wrap text-justify">{catatan || '-'}</div>

          <table className="w-full mt-6 border-none">
            <tbody>
              <tr>
                <td className="text-center w-1/2 align-top border-none">
                  <div className="mb-14">Mengetahui,<br/>Pimpinan Rapat,</div>
                  <div className="font-bold inline-block border-b border-black min-w-[180px] pb-1">{profile.pimpinan || '( ................................... )'}</div>
                </td>
                <td className="text-center w-1/2 align-top border-none">
                  <div className="mb-14">Malang, {profile.tanggal ? new Date(profile.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '......................'}<br/>Notulis,</div>
                  <div className="font-bold inline-block border-b border-black min-w-[180px] pb-1">{profile.notulis || '( ................................... )'}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="break-before-page"></div>

          <div className="mb-4 text-center font-bold text-lg uppercase underline">DAFTAR HADIR RAPAT</div>
          <div className="text-center font-bold mb-6 uppercase">LPI SABILILLAH MALANG</div>
          <div className="mb-4">
            <table className="w-full border-none">
              <tbody>
                <tr><td className="w-32 font-bold py-0.5 border-none">Hari/Tanggal</td><td className="border-none">: {profile.tanggal ? new Date(profile.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '_____________________________'}</td></tr>
                <tr><td className="w-32 font-bold py-0.5 border-none">Waktu</td><td className="border-none">: {profile.waktu ? `${profile.waktu.replace(':', '.')} - Selesai` : '_____________________________'}</td></tr>
                <tr><td className="w-32 font-bold py-0.5 border-none">Jenis Rapat</td><td className="border-none">: {profile.agenda || '_____________________________'}</td></tr>
              </tbody>
            </table>
          </div>

          {attendanceFile && attendanceFile.data ? (
            (attendanceFile.type.includes('image') || attendanceFile.name.match(/\.(jpg|jpeg|png)$/i)) ? (
              <div className="mt-4 flex justify-center"><img src={attendanceFile.data} alt="Daftar Hadir" className="max-w-full max-h-[700px] object-contain border border-gray-300" /></div>
            ) : (
              <div className="mt-8 p-8 border-2 border-dashed border-black text-center">
                <p className="font-bold text-xl mb-3">Daftar Hadir Terlampir Terpisah</p>
                <p className="text-lg">Nama File: <b>{attendanceFile.name}</b></p>
                <p className="text-sm mt-3 text-gray-700">(Dokumen fisik/PDF disematkan secara terpisah dari halaman ini atau tersimpan di sistem Cloud)</p>
                {attendanceFile.isDriveUrl && <p className="text-xs text-blue-600 mt-2 break-all">{attendanceFile.data}</p>}
              </div>
            )
          ) : (
            <div className="mt-8 p-8 border-2 border-dashed border-black text-center"><p className="font-bold text-xl">Daftar Hadir Belum Dilampirkan</p></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-800 font-sans pb-24 selection:bg-emerald-200">
      
      {/* Header Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_30px_rgb(0,0,0,0.03)] sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100/50 rounded-2xl flex items-center justify-center p-2 shadow-inner">
               <img src={icons3D.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent">
                Notulen Rapat SPMI
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-medium tracking-wide">LPI Sabilillah Malang</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {showSaveToast && (
              <span className="bg-emerald-100 text-emerald-700 font-semibold text-xs px-4 py-2 rounded-xl animate-fade-in-up flex items-center gap-2 border border-emerald-200 shadow-sm whitespace-nowrap">
                <Check size={14} className="text-emerald-500" /> Berhasil Disimpan!
              </span>
            )}
            
            <button onClick={handleBaru} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95 text-sm border border-emerald-100 shadow-sm">
              <Plus size={16} /> <span className="hidden md:inline">Baru</span>
            </button>
            
            <button onClick={handleSave} disabled={isSaving} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 text-sm shadow-md ${isSaving ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30'}`}>
              <Save size={16} className={isSaving ? 'animate-pulse' : ''} /> 
              <span className="whitespace-nowrap">{isSaving ? 'Menyimpan...' : 'Simpan Cloud'}</span>
            </button>

            <button onClick={handleDownloadPDF} disabled={isDownloading} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 text-sm shadow-sm border ${isDownloading ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}>
              <Download size={16} /> <span className="whitespace-nowrap">{isDownloading ? 'Memproses...' : 'Unduh PDF'}</span>
            </button>

            <button onClick={handlePrint} disabled={isDownloading} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 text-sm shadow-sm border ${isDownloading ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-emerald-700'}`}>
              <Printer size={16} /> <span>Cetak</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column (Forms) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* SECTION 1: Profil Rapat */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 flex-shrink-0 drop-shadow-sm"><img src={icons3D.profil} alt="Profil" className="w-full h-full object-contain" /></div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Profil Rapat</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Nomor Notulen</label>
                <input type="text" name="nomor" value={profile.nomor} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none" placeholder="Contoh: 001/LPI/2026" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Sifat Rapat</label>
                <div className="relative">
                  <select name="sifat" value={profile.sifat} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer">
                    <option value="Rutin">Rutin</option><option value="Insidentil">Insidentil</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Agenda / Topik Utama</label>
                <input type="text" name="agenda" value={profile.agenda} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none font-bold text-lg text-emerald-900" placeholder="Ketik judul agenda rapat di sini..." />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-1.5"><Calendar size={14} className="text-emerald-600"/> Tanggal</label>
                <input type="date" name="tanggal" value={profile.tanggal} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-1.5"><Clock size={14} className="text-emerald-600"/> Waktu Mulai</label>
                <input type="time" name="waktu" value={profile.waktu} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700" />
              </div>
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-1.5"><MapPin size={14} className="text-emerald-600"/> Tempat Pelaksanaan</label>
                <input type="text" name="tempat" value={profile.tempat} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none" placeholder="Misal: Ruang Rapat Pimpinan LPI" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Jumlah Hadir (Orang)</label>
                <input type="number" name="jumlahHadir" value={profile.jumlahHadir} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none" placeholder="15" min="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1">Total Peserta (Orang)</label>
                <input type="number" name="totalPeserta" value={profile.totalPeserta} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none" placeholder="20" min="0" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-1.5"><User size={14} className="text-emerald-600"/> Pimpinan Rapat</label>
                <input type="text" name="pimpinan" value={profile.pimpinan} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none font-medium" placeholder="Nama Pimpinan" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-1.5"><User size={14} className="text-emerald-600"/> Notulis</label>
                <input type="text" name="notulis" value={profile.notulis} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none font-medium" placeholder="Nama Notulis" />
              </div>
            </div>
          </section>

          {/* SECTION 2: Isu & Topik Utama */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex-shrink-0 drop-shadow-sm"><img src={icons3D.topik} alt="Topik" className="w-full h-full object-contain" /></div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Isu & Topik Bahasan</h2>
              </div>
              <button onClick={() => addItem(setTopics, { nama: '', masalah: '', masukan: '' })} className="flex items-center justify-center gap-2 text-sm bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-100 font-semibold transition-all active:scale-95 border border-emerald-100">
                <Plus size={16}/> Tambah Topik
              </button>
            </div>
            
            <div className="space-y-5">
              {topics.map((topic, idx) => (
                <div key={topic.id} className="p-5 md:p-6 rounded-2xl bg-slate-50/50 border border-slate-200/60 relative group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300">
                  
                  {topics.length > 1 && (
                    <button onClick={() => removeItem(topic.id, setTopics)} className="absolute top-4 right-4 p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-100" title="Hapus Topik">
                      <Trash2 size={16}/>
                    </button>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4 pr-12">
                     <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</span>
                     <input type="text" value={topic.nama} onChange={(e) => updateItem(topic.id, 'nama', e.target.value, setTopics)} className="w-full bg-transparent border-b-2 border-slate-200 focus:border-emerald-500 pb-1 outline-none font-bold text-lg text-slate-800 placeholder-slate-400 transition-colors" placeholder="Judul Topik Pembahasan..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600 ml-1">Deskripsi Masalah / Latar Belakang</label>
                      <textarea value={topic.masalah} onChange={(e) => updateItem(topic.id, 'masalah', e.target.value, setTopics)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none min-h-[100px] text-sm resize-y leading-relaxed text-slate-700" placeholder="Uraikan inti permasalahan secara ringkas..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600 ml-1">Pandangan / Masukan Forum</label>
                      <textarea value={topic.masukan} onChange={(e) => updateItem(topic.id, 'masukan', e.target.value, setTopics)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none min-h-[100px] text-sm resize-y leading-relaxed text-slate-700" placeholder="Poin-poin masukan dari peserta rapat..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Keputusan & Rencana Aksi */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex-shrink-0 drop-shadow-sm"><img src={icons3D.aksi} alt="Aksi" className="w-full h-full object-contain" /></div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Keputusan & Tindak Lanjut</h2>
              </div>
              <button onClick={() => addItem(setActions, { topikId: '', solusi: '', pj: '', tenggatWaktu: '' })} className="flex items-center justify-center gap-2 text-sm bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl hover:bg-amber-100 font-semibold transition-all active:scale-95 border border-amber-200">
                <Plus size={16}/> Tambah Aksi
              </button>
            </div>
            
            <div className="space-y-5">
              {actions.map((action, idx) => (
                <div key={action.id} className="p-5 md:p-6 rounded-2xl bg-slate-50/50 border border-slate-200/60 relative group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300">
                  
                  {/* Nomor & Tombol Hapus */}
                  <div className="absolute top-5 left-5 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shadow-sm border border-amber-200">
                    {idx + 1}
                  </div>

                  <button onClick={() => removeItem(action.id, setActions)} className="absolute top-5 right-5 p-2 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 md:group-hover:opacity-100 transition-all shadow-sm border border-slate-100 z-10" title="Hapus Aksi">
                    <Trash2 size={16}/>
                  </button>

                  <div className="pl-12 pr-2 md:pr-8 flex flex-col gap-5">
                    {/* Baris 1: Pilihan Topik */}
                    <div className="w-full lg:w-2/3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 block">Terkait Topik Pembahasan</label>
                      <div className="relative">
                        <select value={action.topikId} onChange={(e) => updateItem(action.id, 'topikId', e.target.value, setActions)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer text-slate-700 font-medium transition-shadow">
                          <option value="">- Pilih Topik yang Terkait -</option>
                          {topics.map(t => (<option key={t.id} value={t.id}>{t.nama ? t.nama : 'Topik Tanpa Judul'}</option>))}
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {/* Baris 2: Tata Letak Kolom Grid (Solusi, PJ, Tenggat) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-6 space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 block">Solusi & Keputusan Akhir</label>
                         <textarea value={action.solusi} onChange={(e) => updateItem(action.id, 'solusi', e.target.value, setActions)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[100px] resize-y text-slate-700 transition-shadow leading-relaxed" placeholder="Uraikan detail keputusan final..." />
                      </div>
                      
                      <div className="lg:col-span-3 space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 block">PJ (Penanggung Jawab)</label>
                         <input type="text" value={action.pj} onChange={(e) => updateItem(action.id, 'pj', e.target.value, setActions)} className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200/80 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/30 font-bold text-amber-900 placeholder-amber-300 transition-shadow" placeholder="Nama PJ / Divisi"/>
                      </div>
                      
                      <div className="lg:col-span-3 space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 block">Tenggat Waktu</label>
                         <input type="date" value={action.tenggatWaktu} onChange={(e) => updateItem(action.id, 'tenggatWaktu', e.target.value, setActions)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold text-slate-700 transition-shadow cursor-text" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {actions.length === 0 && (
                <div className="p-10 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 font-medium">
                  Belum ada keputusan atau rencana aksi yang ditambahkan.
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: Catatan Tambahan */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8">
             <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 flex-shrink-0 drop-shadow-sm"><img src={icons3D.catatan} alt="Catatan" className="w-full h-full object-contain" /></div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Catatan Tambahan</h2>
            </div>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all outline-none min-h-[120px] text-slate-700 leading-relaxed" placeholder="Tulis instruksi pimpinan rapat atau hal lain di luar agenda utama..." />
          </section>
        </div>

        {/* Right Column (Sidebar Panels) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* PANEL: Riwayat Cloud */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 drop-shadow-sm"><img src={icons3D.riwayat} alt="Riwayat" className="w-full h-full object-contain" /></div>
                <h2 className="text-lg font-bold text-slate-800">Riwayat Cloud</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchNotulenList} disabled={isLoadingList} className="p-2 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Muat Ulang Database">
                  <RefreshCw size={16} className={isLoadingList ? "animate-spin text-emerald-600" : ""} />
                </button>
                <span className="bg-emerald-100/80 text-emerald-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200">{savedList.length}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
              `}</style>
              
              {connectionError ? (
                <div className="text-center text-red-600 text-sm py-6 px-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-center justify-center h-full">
                  <AlertCircle size={24} className="mb-2 text-red-400" />
                  <p>{connectionError}</p>
                </div>
              ) : isLoadingList && savedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                   <Activity size={24} className="animate-pulse text-emerald-400" />
                   <span className="text-sm font-medium">Sinkronisasi data...</span>
                </div>
              ) : savedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                   <div className="w-16 h-16 opacity-50 grayscale"><img src={icons3D.riwayat} alt="Empty" className="w-full h-full" /></div>
                   <span className="text-sm">Belum ada arsip tersimpan.</span>
                </div>
              ) : (
                savedList.map(item => (
                  <div key={item.id} onClick={() => loadNotulen(item)} className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group relative ${currentDocId === item.id ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200/60 hover:border-slate-300 hover:shadow-sm'}`}>
                    <div className="font-bold text-sm text-slate-800 truncate pr-8 mb-1">
                      {item.profile?.agenda || 'Tanpa Judul Agenda'}
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between items-center font-medium">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {item.profile?.tanggal ? new Date(item.profile.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'}) : 'N/A'}</span>
                      <span className="truncate ml-2 text-slate-400">{item.profile?.pimpinan || 'Anonim'}</span>
                    </div>
                    
                    {deleteConfirmId === item.id ? (
                      <div className="absolute top-0 right-0 bottom-0 bg-red-50/95 backdrop-blur-sm rounded-r-2xl flex items-center px-3 gap-2 border-l border-red-200 z-10 animate-fade-in-right">
                        <span className="text-xs text-red-700 font-bold">Hapus?</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteNotulen(item.id); }} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-90 shadow-sm"><Check size={14}/></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="p-1.5 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 active:scale-90"><X size={14}/></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 md:group-hover:opacity-100 transition-all shadow-sm border border-slate-100" title="Hapus Arsip">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* PANEL: Lampiran Daftar Hadir */}
          <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
             <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 flex-shrink-0 drop-shadow-sm"><img src={icons3D.lampiran} alt="Lampiran" className="w-full h-full object-contain" /></div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Lampiran File</h2>
            </div>
            
            {fileError && <div className="mb-4 text-xs text-red-700 bg-red-50 p-3 rounded-xl flex items-start gap-2 border border-red-100"><AlertCircle size={16} className="shrink-0 text-red-500" /><span>{fileError}</span></div>}
            
            {!attendanceFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group min-h-[200px]">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md group-hover:text-emerald-600 transition-all">
                  <Upload size={28} />
                </div>
                <span className="text-sm font-bold text-slate-700 mb-1 group-hover:text-emerald-700">Unggah Daftar Hadir</span>
                <span className="text-xs text-slate-400 font-medium text-center px-4">Format: PDF, DOCX, JPG, PNG<br/>(Maksimal 800 KB)</span>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
                
                <button onClick={() => setAttendanceFile(null)} className="absolute top-3 right-3 p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl shadow-sm transition-colors z-10 border border-slate-100">
                  <Trash2 size={16}/>
                </button>
                
                <div className="flex flex-col items-center text-center relative z-10 mt-2">
                  {attendanceFile.isDriveUrl ? (
                    <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-inner border border-blue-200">
                      <FileIcon size={36} strokeWidth={1.5} />
                    </div>
                  ) : (attendanceFile.type.includes('image') || attendanceFile.name.match(/\.(jpg|jpeg|png)$/i)) ? (
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-2 border-emerald-200 shadow-sm p-1">
                      <img src={attendanceFile.data} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-inner border border-red-200">
                      <FileIcon size={36} strokeWidth={1.5} />
                    </div>
                  )}
                  
                  <span className="text-sm font-bold text-slate-800 break-all w-full px-4 mb-2">{attendanceFile.name}</span>
                  
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-sm ${attendanceFile.isDriveUrl ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {attendanceFile.isDriveUrl ? <><Check size={12}/> Tersimpan di Google Drive</> : <><AlertCircle size={12}/> Siap Diunggah</>}
                  </span>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;