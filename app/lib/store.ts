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
      preEducationLevel: 'partial',
      preEducationDetail: '',
      goalType: 'direct_sale',
      goalDescription: '',
    },
    script: null,
    objectionDictionary: null,
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

export function exportAllData(): string {
  const projects = getProjects();
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
  };
  return JSON.stringify(exportData, null, 2);
}

export function importAllData(jsonString: string): { added: number; updated: number } {
  const data = JSON.parse(jsonString);
  const imported: ConsultationProject[] = data.projects || data;
  if (!Array.isArray(imported)) throw new Error('無効なデータ形式です');

  const existing = getProjects();
  let added = 0;
  let updated = 0;

  for (const project of imported) {
    if (!project.id || !project.name) continue;
    const idx = existing.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...project };
      updated++;
    } else {
      existing.push(project);
      added++;
    }
  }

  saveProjects(existing);
  return { added, updated };
}
