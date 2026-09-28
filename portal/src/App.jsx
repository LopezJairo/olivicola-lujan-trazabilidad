import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import DownloadCards from './components/DownloadCards';
import InstallationGuide from './components/InstallationGuide';
import ReleaseHistory from './components/ReleaseHistory';
import Footer from './components/Footer';
import AdminModal from './components/AdminModal';
import { DEFAULT_VERSIONS_DATA } from './data/defaultVersions';

export default function App() {
  const [versionsData, setVersionsData] = useState(() => {
    try {
      const cached = localStorage.getItem('olivicola_portal_versions');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return DEFAULT_VERSIONS_DATA;
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live versions.json if available
  useEffect(() => {
    fetch('/versions.json?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (data && data.releases) {
          // If no local override, set from remote file
          const hasLocalOverride = localStorage.getItem('olivicola_portal_versions_override');
          if (!hasLocalOverride) {
            setVersionsData(data);
          }
        }
      })
      .catch(err => {
        console.log('Using default or cached versions:', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSaveVersions = (updatedData) => {
    setVersionsData(updatedData);
    try {
      localStorage.setItem('olivicola_portal_versions', JSON.stringify(updatedData));
      localStorage.setItem('olivicola_portal_versions_override', 'true');
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
  };

  const latestRelease = versionsData?.releases?.[0] || DEFAULT_VERSIONS_DATA.releases[0];

  return (
    <div className="relative min-h-screen bg-[#070b07] text-zinc-100 overflow-x-hidden">
      {/* Background Subtle Ambience */}
      <div className="fixed inset-0 bg-radial-ambient pointer-events-none" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 -left-40 w-[500px] h-[500px] bg-emerald-700/[0.02] rounded-full blur-[120px] pointer-events-none" />
      
      {/* App Content */}
      <div className="relative z-10">
        <Navbar
          latestVersion={versionsData?.latest_version || '1.0.0'}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        <main>
          <HeroSection latestRelease={latestRelease} />
          
          <DownloadCards release={latestRelease} />

          <InstallationGuide />

          <ReleaseHistory releases={versionsData?.releases || []} />
        </main>

        <Footer
          updatedAt={versionsData?.updated_at}
          contactSupport={versionsData?.contact_support}
        />

        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          versionsData={versionsData}
          onSaveVersions={handleSaveVersions}
        />
      </div>
    </div>
  );
}
