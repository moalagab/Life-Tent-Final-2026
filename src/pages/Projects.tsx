import { useState, lazy, Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Filter, Search, Loader2, FolderKanban, BarChart3, LayoutDashboard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects, useUpdateProject, useDeleteProject, Project } from '@/hooks/useProjects';
import { toast } from 'sonner';

import { ProjectTabs } from '@/components/projects/ProjectTabs';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectDetailDialog } from '@/components/projects/ProjectDetailDialog';
import { ProjectNotifications } from '@/components/projects/ProjectNotifications';
import { ShareDialog } from '@/components/ui/ShareDialog';

// Heavy sub-views — lazy-loaded only when the user activates them
const ProjectReports    = lazy(() => import('@/components/projects/ProjectReports').then(m => ({ default: m.ProjectReports })));
const AdvancedDashboard = lazy(() => import('@/components/projects/AdvancedDashboard').then(m => ({ default: m.AdvancedDashboard })));
const CRMView           = lazy(() => import('@/components/crm/CRMView').then(m => ({ default: m.CRMView })));
const AreasView         = lazy(() => import('@/components/para/AreasView').then(m => ({ default: m.AreasView })));
const ResourcesView     = lazy(() => import('@/components/para/ResourcesView').then(m => ({ default: m.ResourcesView })));
const ArchiveView       = lazy(() => import('@/components/para/ArchiveView').then(m => ({ default: m.ArchiveView })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

export default function Projects() {
  const { t, currentLanguage } = useLanguage();
  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  
  const [activeTab, setActiveTab] = useState('projects');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCRM, setShowCRM] = useState(false);

  const handleProjectFromNotification = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (project) setSelectedProject(project);
  };
  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject.mutateAsync(projectId);
      toast.success(t('projects.projectDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        status: 'archived',
        para_category: 'archive'
      });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const getFilteredProjects = () => {
    if (!projects) return [];
    
    let filtered = projects;
    
    // Filter by PARA category
    switch (activeTab) {
      case 'projects':
        filtered = projects.filter(p => p.para_category === 'project' || !p.para_category);
        break;
      case 'areas':
        filtered = projects.filter(p => p.para_category === 'area');
        break;
      case 'resources':
        filtered = projects.filter(p => p.para_category === 'resource');
        break;
      case 'archives':
        filtered = projects.filter(p => p.para_category === 'archive' || p.status === 'archived');
        break;
      default:
        break;
    }
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const filteredProjects = getFilteredProjects();

  return (
    <MainLayout>
      <div className="mb-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-primary" strokeWidth={2} />
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{t('projects.title')}</h1>
              <p className="text-[11px] text-muted-foreground">
                {filteredProjects.length} {currentLanguage === 'ar' ? 'مشروع' : 'projects'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('projects.newProject')}</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('projects.searchProjects')}
              className="w-full ps-10 pe-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button
            variant={showCRM ? 'default' : 'outline'}
            size="default"
            onClick={() => { setShowCRM(!showCRM); setShowDashboard(false); setShowReports(false); }}
          >
            <Users className="w-4 h-4 me-2" />
            {currentLanguage === 'ar' ? 'CRM' : 'CRM'}
          </Button>
          <Button
            variant={showDashboard ? 'default' : 'outline'}
            size="default"
            onClick={() => { setShowDashboard(!showDashboard); setShowReports(false); setShowCRM(false); }}
          >
            <LayoutDashboard className="w-4 h-4 me-2" />
            <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
          </Button>
          <Button
            variant={showReports ? 'default' : 'outline'}
            size="default"
            onClick={() => { setShowReports(!showReports); setShowDashboard(false); setShowCRM(false); }}
          >
            <BarChart3 className="w-4 h-4 me-2" />
            <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'التقارير' : 'Reports'}</span>
          </Button>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 me-2" />
            <span className="hidden sm:inline">{t('common.filter')}</span>
          </Button>
        </div>
      </div>

      {/* CRM View */}
      {showCRM ? (
        <Suspense fallback={<TabLoader />}><CRMView /></Suspense>
      ) : (
        <>
          {/* Notifications */}
          <ProjectNotifications onProjectClick={handleProjectFromNotification} />

          {/* Advanced Dashboard */}
          {showDashboard && (
            <div className="mb-6">
              <Suspense fallback={<TabLoader />}><AdvancedDashboard /></Suspense>
            </div>
          )}

          {/* Reports */}
          {showReports && (
            <div className="mb-6">
              <Suspense fallback={<TabLoader />}><ProjectReports /></Suspense>
            </div>
          )}

          {/* PARA Tabs */}
          <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content based on active tab */}
          {activeTab === 'areas' ? (
            <Suspense fallback={<TabLoader />}><AreasView /></Suspense>
          ) : activeTab === 'resources' ? (
            <Suspense fallback={<TabLoader />}><ResourcesView /></Suspense>
          ) : activeTab === 'archives' ? (
            <Suspense fallback={<TabLoader />}><ArchiveView /></Suspense>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={setSelectedProject}
              onEdit={setSelectedProject}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onShare={(p) => setSharingProject(p)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t('projects.newProject')}
          </Button>
        </div>
          )}

          {/* Dialogs */}
          <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
          <ProjectDetailDialog
            project={selectedProject}
            open={!!selectedProject}
            onOpenChange={(open) => !open && setSelectedProject(null)}
          />
          {sharingProject && (
            <ShareDialog
              open={!!sharingProject}
              onOpenChange={(open) => !open && setSharingProject(null)}
              projectId={sharingProject.id}
              projectName={sharingProject.title}
            />
          )}
        </>
      )}
    </MainLayout>
  );
}
