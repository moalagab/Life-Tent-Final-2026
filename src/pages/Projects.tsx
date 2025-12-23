import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Filter, Search, Loader2, FolderKanban, BarChart3, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects, useUpdateProject, useDeleteProject, Project } from '@/hooks/useProjects';
import { toast } from 'sonner';

import { ProjectTabs } from '@/components/projects/ProjectTabs';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectDetailDialog } from '@/components/projects/ProjectDetailDialog';
import { PlanningPipelineView } from '@/components/projects/PlanningPipelineView';
import { ProjectReports } from '@/components/projects/ProjectReports';
import { ProjectNotifications } from '@/components/projects/ProjectNotifications';
import { AdvancedDashboard } from '@/components/projects/AdvancedDashboard';

export default function Projects() {
  const { t, currentLanguage } = useLanguage();
  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  
  const [activeTab, setActiveTab] = useState('projects');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('projects.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('projects.subtitle')}</p>
          </div>
          <Button variant="gold" size="lg" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-5 h-5 me-2" />
            {t('projects.newProject')}
          </Button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('projects.searchProjects')}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button 
            variant={showDashboard ? 'default' : 'outline'} 
            size="default"
            onClick={() => { setShowDashboard(!showDashboard); setShowReports(false); }}
          >
            <LayoutDashboard className="w-4 h-4 me-2" />
            {currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </Button>
          <Button 
            variant={showReports ? 'default' : 'outline'} 
            size="default"
            onClick={() => { setShowReports(!showReports); setShowDashboard(false); }}
          >
            <BarChart3 className="w-4 h-4 me-2" />
            {currentLanguage === 'ar' ? 'التقارير' : 'Reports'}
          </Button>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 me-2" />
            {t('common.filter')}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <ProjectNotifications onProjectClick={handleProjectFromNotification} />

      {/* Advanced Dashboard */}
      {showDashboard && (
        <div className="mb-6">
          <AdvancedDashboard />
        </div>
      )}

      {/* Reports */}
      {showReports && (
        <div className="mb-6">
          <ProjectReports />
        </div>
      )}

      {/* PARA Tabs */}
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'pipeline' ? (
        <PlanningPipelineView />
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
    </MainLayout>
  );
}
