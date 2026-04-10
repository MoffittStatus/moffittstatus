'use client'
import React from 'react';
import { 
  MapPin, 
  Star, 
  BarChart2, 
  BookOpen, 
  Calendar, 
  Award, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import dynamic from 'next/dynamic';
const Experience = dynamic(() => import('../components/Experience').then(mod => mod.Experience), { ssr: false });

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  progress?: {
    current: number;
    total: number;
  };
}

interface Quest {
  id: string;
  title: string;
  points: number;
  icon: React.ReactNode;
}

import { useSession } from 'next-auth/react';

const RewardsPage: React.FC = () => {
  const { data: session } = useSession();
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const allRes = await fetch('http://localhost:8000/api/achievements');
        const allAchievements = await allRes.json();

        let userEarnedIds: number[] = [];
        // @ts-ignore
        if (session?.user?.id) {
          // @ts-ignore
          const userRes = await fetch(`http://localhost:8000/api/achievements/user/${session.user.id}`);
          const userEarned = await userRes.json();
          userEarnedIds = userEarned.map((ua: any) => ua.achievementId);
        }

        const mapped = allAchievements.map((ach: any) => ({
          id: ach.id.toString(),
          title: ach.name,
          description: ach.description,
          icon: getIcon(ach.icon),
          isUnlocked: userEarnedIds.includes(ach.id),
        }));

        setAchievements(mapped);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-6 h-6" />;
      case 'Award': return <Award className="w-6 h-6" />;
      case 'Sun': return <Star className="w-6 h-6" />;
      case 'Moon': return <Star className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const userPoints = 450;
  
  const quests: Quest[] = [
    {
      id: '1',
      title: 'Rate Library Busyness',
      points: 50,
      icon: <BarChart2 className="w-5 h-5 text-white" />
    },
    {
      id: '2',
      title: 'Check-in at Location',
      points: 20,
      icon: <MapPin className="w-5 h-5 text-white" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        
        {/* Header: Points & Profile */}
        <header className="flex justify-between items-center mb-6 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-[#003262]">Achievements</h1>
            <p className="text-sm text-gray-500">Keep collecting books!</p>
          </div>
          {/* <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-yellow-600 fill-current" />
            </div>
            <span className="font-bold text-[#003262] text-sm">{userPoints} pts</span>
          </div> */}
        </header>

        {/* Daily Quests */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Daily Quests</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {quests.map((quest) => (
              <button 
                key={quest.id}
                className="flex-shrink-0 w-40 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#003262] flex items-center justify-center shadow-blue-200 shadow-md">
                  {quest.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">{quest.title}</h3>
                  {/* <p className="text-xs text-[#003262] font-semibold mt-1">+{quest.points} pts</p> */}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className='mt-20 mb-10 w-full'>
        <Experience asset={'Achievements'}  />
        </div>
        {/* Achievements */}
        <div className="mb-20">
          <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Collection</h2>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((item) => (
              <div 
                key={item.id} 
                className={`relative p-4 rounded-2xl border transition-all ${
                  item.isUnlocked 
                    ? 'bg-white border-blue-100 shadow-sm' 
                    : 'bg-gray-100 border-transparent opacity-80'
                }`}
              >
                {/* Icon Circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  item.isUnlocked 
                    ? 'bg-blue-50 text-[#003262]' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {item.isUnlocked ? item.icon : <Lock className="w-5 h-5" />}
                </div>

                {/* Content */}
                <h3 className={`font-bold text-sm mb-1 ${item.isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-snug mb-3">
                  {item.description}
                </p>

                {/* Progress Bar */}
                {!item.isUnlocked && item.progress && (
                  <div className="w-full">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1">
                      <span>Progress</span>
                      <span>{item.progress.current}/{item.progress.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#003262] rounded-full" 
                        style={{ width: `${(item.progress.current / item.progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Completed Badge */}
                {item.isUnlocked && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RewardsPage;