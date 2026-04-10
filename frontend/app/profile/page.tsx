'use client'

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Calendar,
  CheckCircle2,
  Lock,
  Zap,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  earnedAt?: string;
  status?: string;
}

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profileStats, setProfileStats] = useState({
    reportsCount: 0,
    points: 0,
    rank: 'Unranked'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    // @ts-ignore
    if (session?.user?.id) {
       fetchAchievements();
    }
  }, [status, session]);

  const fetchAchievements = async () => {
    try {
      // @ts-ignore
      const [achievementsRes, profileRes] = await Promise.all([
        fetch(`http://localhost:8000/api/achievements/user/${session?.user?.id}`),
        fetch(`http://localhost:8000/api/user/${session?.user?.id}/profile`)
      ]);
      const data = await achievementsRes.json();
      const profileData = await profileRes.json();

      setAchievements(data.map((ua: any) => ({
        ...ua.achievement,
        earnedAt: ua.earnedAt,
        status: ua.status
      })));
      setProfileStats({
        reportsCount: profileData.reportsCount || 0,
        points: profileData.points || 0,
        rank: profileData.rank || 'Unranked'
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003262]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header / Hero Section */}
      <div className="bg-[#003262] pt-24 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105 duration-300">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="Profile" width={128} height={128} />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-16 h-16 text-[#003262]" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-xl shadow-lg border-2 border-[#003262]">
              <Zap className="w-5 h-5 text-[#003262] fill-[#003262]" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              {session?.user?.name || 'Anonymous User'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-blue-100/80 text-sm font-medium">
                <Mail className="w-4 h-4" />
                {session?.user?.email}
              </div>
              <div className="flex items-center gap-2 text-blue-100/80 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Joined March 2026
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 backdrop-blur-md">
                <Settings className="w-6 h-6" />
             </button>
             <button 
              onClick={() => signOut()}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-100 rounded-2xl transition-all border border-rose-500/20 backdrop-blur-md"
             >
                <LogOut className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stat Cards */}
          {[
            { label: 'Reports', value: profileStats.reportsCount.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Points', value: profileStats.points.toString(), icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Rank', value: profileStats.rank, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-800">Your Achievements</h2>
            <span className="text-sm font-bold text-[#003262] bg-blue-50 px-4 py-1.5 rounded-full">
              {achievements.length} Earned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((item) => (
              <div 
                key={item.id} 
                className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-[#003262] flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 leading-snug mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#003262] bg-blue-50 px-2 py-0.5 rounded-md">
                        +{item.points} PTS
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {item.earnedAt ? new Date(item.earnedAt).toLocaleDateString() : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-white" />
                </div>
              </div>
            ))}

            {/* Locked Achievements Placeholder */}
            {[1, 2].map((_, i) => (
              <div 
                key={`locked-${i}`} 
                className="bg-gray-50/50 p-6 rounded-3xl border border-gray-200 border-dashed opacity-60 grayscale"
              >
                <div className="flex gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded-full mb-2 animate-pulse"></div>
                    <div className="h-3 w-48 bg-gray-100 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
