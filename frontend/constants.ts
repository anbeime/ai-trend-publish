import { Asset, AssetType, Project, ProjectStatus } from './types';

// Mock Assets mimicking System Assets from PRD
export const MOCK_ASSETS: Asset[] = [
  // Avatars
  {
    id: 'sys_avatar_1',
    type: AssetType.AVATAR,
    title: 'Professional Host (Sarah)',
    isSystem: true,
    fileUrl: 'https://picsum.photos/id/64/300/533', // Portrait aspect
    metadata: { tags: ['Professional', 'News'] }
  },
  {
    id: 'sys_avatar_2',
    type: AssetType.AVATAR,
    title: 'Casual Tech (Mike)',
    isSystem: true,
    fileUrl: 'https://picsum.photos/id/91/300/533',
    metadata: { tags: ['Tech', 'Casual'] }
  },
  // Voices
  {
    id: 'sys_voice_1',
    type: AssetType.VOICE,
    title: 'Warm Female (Kore)',
    isSystem: true,
    previewUrl: '#', 
    metadata: { gender: 'female', tags: ['Warm', 'Storytelling'] }
  },
  {
    id: 'sys_voice_2',
    type: AssetType.VOICE,
    title: 'Energetic Male (Fenrir)',
    isSystem: true,
    previewUrl: '#',
    metadata: { gender: 'male', tags: ['Energetic', 'Sales'] }
  },
  // Scripts
  {
    id: 'sys_script_1',
    type: AssetType.SCRIPT,
    title: 'Product Launch Hook',
    isSystem: true,
    content: 'Stop scrolling! You won\'t believe what we just released. This tool changes everything about how you create content.',
    metadata: { estimatedSeconds: 12 }
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Q4 Marketing Campaign',
    status: ProjectStatus.COMPLETED,
    thumbnailUrl: 'https://picsum.photos/id/237/400/225',
    videoUrl: '#',
    createdAt: '2023-10-25T10:00:00Z',
    assets: {}
  },
  {
    id: 'p2',
    title: 'TikTok Viral Hook #3',
    status: ProjectStatus.GENERATING_VIDEO,
    thumbnailUrl: 'https://picsum.photos/id/238/400/225',
    createdAt: '2023-10-26T14:30:00Z',
    assets: {}
  }
];

export const PERFORMANCE_TAGS = [
  '😊 Friendly',
  '💪 Confident',
  '😎 Cool',
  '🎉 Excited',
  '😐 Serious',
  '🤫 Whispering'
];
