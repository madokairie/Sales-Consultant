import { ConsultationProject } from './types';

const STORAGE_KEY = 'sales-consultant-projects';

function getProjects(): ConsultationProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: ConsultationProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(): ConsultationProject[] {
  return getProjects().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getProject(id: string): ConsultationProject | null {
  return getProjects().find(p => p.id === id) || null;
}

export function createProject(name: string): ConsultationProject {
  const project: ConsultationProject = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {
      productName: '',
      productPrice: '',
      productDescription: '',
      productBenefits: '',
      targetAudience: '',
      consultationType: 'online',
      consultationDuration: '60',
      competitors: '',
      differentiators: '',
      commonObjections: '',
      closingConditions: '',
      goalType: 'direct_sale',
      goalDescription: '',
    },
    script: null,
    sessions: [],
  };
  const all = getProjects();
  all.push(project);
  saveProjects(all);
  return project;
}

export function updateProject(id: string, updates: Partial<ConsultationProject>): ConsultationProject | null {
  const all = getProjects();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(all);
  return all[idx];
}

export function deleteProject(id: string): boolean {
  const all = getProjects();
  const filtered = all.filter(p => p.id !== id);
  if (filtered.length === all.length) return false;
  saveProjects(filtered);
  return true;
}
